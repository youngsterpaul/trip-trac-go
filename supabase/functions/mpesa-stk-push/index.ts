import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Input validation schemas
const bookingDataSchema = z.object({
  item_id: z.string().uuid("Invalid item ID"),
  booking_type: z.enum(["trip", "event", "hotel", "adventure_place", "adventure", "attraction"]),
  total_amount: z.number().positive().max(10000000, "Amount too large"),
  booking_details: z.any(),
  user_id: z.string().uuid().optional().nullable(),
  is_guest_booking: z.boolean().optional(),
  guest_name: z.string().min(1).max(100).optional(),
  guest_email: z.string().email().max(255).optional().nullable(),
  guest_phone: z.string().max(20).optional().nullable(),
  visit_date: z.string().optional().nullable(),
  slots_booked: z.number().int().positive().max(100).optional(),
  host_id: z.string().uuid().optional().nullable(),
  referral_tracking_id: z.string().uuid().optional().nullable(),
  emailData: z.any().optional(),
});

const phoneSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/\s+/g, "") : v),
  z
    .string()
    .min(9, "Phone number too short")
    .max(15, "Phone number too long")
    // Accept: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX, +25407XXXXXXXX
    .regex(/^(\+?254|0)?0?[17]\d{8}$/, "Invalid Kenyan phone number format")
);

const stkPushRequestSchema = z.object({
  phoneNumber: phoneSchema,
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(1, "Minimum amount is 1")
    .max(150000, "Maximum M-Pesa transaction is 150,000"),
  accountReference: z.string().min(1).max(12),
  transactionDesc: z.string().min(1).max(13),
  bookingData: bookingDataSchema,
});

const safeJsonParse = (text: string) => {
  try {
    return { ok: true as const, json: JSON.parse(text) };
  } catch {
    return { ok: false as const, text };
  }
};

async function getOAuthToken(consumerKey: string, consumerSecret: string) {
  const auth = btoa(`${consumerKey}:${consumerSecret}`);

  // Use MPESA_ENV to determine environment, default to sandbox for safety
  const mpesaEnv = Deno.env.get("MPESA_ENV") || "sandbox";
  const baseUrl = mpesaEnv === "production" 
    ? "https://api.safaricom.co.ke" 
    : "https://sandbox.safaricom.co.ke";

  console.log("Using M-Pesa environment:", { mpesaEnv, baseUrl });

  try {
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const bodyText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      console.error("OAuth token fetch failed:", { baseUrl, status: tokenResponse.status, body: bodyText.slice(0, 800) });
      return { ok: false as const, last: { baseUrl, status: tokenResponse.status, body: bodyText.slice(0, 800) } };
    }

    const parsed = safeJsonParse(bodyText);
    if (!parsed.ok || !parsed.json?.access_token) {
      console.error("OAuth token response missing access_token:", { baseUrl, body: bodyText.slice(0, 800) });
      return { ok: false as const, last: { baseUrl, body: bodyText.slice(0, 800) } };
    }

    return { ok: true as const, baseUrl, accessToken: parsed.json.access_token as string };
  } catch (e) {
    console.error("OAuth token fetch exception:", baseUrl, e);
    return { ok: false as const, last: { baseUrl, body: String(e).slice(0, 800) } };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();

    let validatedData: z.infer<typeof stkPushRequestSchema>;
    try {
      validatedData = stkPushRequestSchema.parse(rawData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Validation error:", validationError.errors);
        return jsonResponse({
          success: false,
          error: "Invalid input",
          details: validationError.errors,
        });
      }
      throw validationError;
    }

    const { phoneNumber, amount, accountReference, transactionDesc, bookingData } = validatedData;

    console.log("STK Push request received:", {
      phoneNumber,
      amount,
      accountReference,
      booking_type: bookingData.booking_type,
      item_id: bookingData.item_id,
    });

    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");

    if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
      console.error("Missing M-Pesa credentials", {
        hasKey: !!consumerKey,
        hasSecret: !!consumerSecret,
        hasPasskey: !!passkey,
        hasShortcode: !!shortcode,
      });
      return jsonResponse({ success: false, error: "M-Pesa credentials not configured" });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify item exists before proceeding
    let tableName = "trips";
    if (bookingData.booking_type === "hotel") {
      tableName = "hotels";
    } else if (bookingData.booking_type === "adventure" || bookingData.booking_type === "adventure_place") {
      tableName = "adventure_places";
    }

    const { data: item, error: itemError } = await supabaseClient
      .from(tableName)
      .select("id, created_by, approval_status")
      .eq("id", bookingData.item_id)
      .maybeSingle();

    if (itemError || !item) {
      console.error("Item not found:", bookingData.item_id, itemError);
      return jsonResponse({
        success: false,
        error: "Item not found or does not exist",
      });
    }

    if ((item as any).approval_status !== "approved") {
      console.error("Item not approved:", bookingData.item_id, (item as any).approval_status);
      return jsonResponse({
        success: false,
        error: "Item is not available for booking",
      });
    }

    // OAuth token (try production then sandbox)
    const tokenResult = await getOAuthToken(consumerKey, consumerSecret);
    if (!tokenResult.ok) {
      return jsonResponse({
        success: false,
        error: "Failed to get OAuth token",
        details: tokenResult.last,
      });
    }

    const { baseUrl, accessToken } = tokenResult;
    console.log("OAuth token obtained successfully", { baseUrl });

    // Timestamp + password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Format phone number (remove leading 0 or +254, ensure starts with 254)
    let formattedPhone = phoneNumber.replace(/\s/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+254")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("2540")) {
      formattedPhone = "254" + formattedPhone.substring(4);
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    const callbackURL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackURL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    };

    console.log("Initiating STK Push:", {
      ...stkPushPayload,
      Password: "[REDACTED]",
      CallBackURL: callbackURL,
      baseUrl,
    });

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkText = await stkResponse.text();
    const parsedStk = safeJsonParse(stkText);
    const stkData = parsedStk.ok ? parsedStk.json : { raw: stkText.slice(0, 1200) };

    console.log("STK Push response:", stkData);

    const responseCode = (stkData as any)?.ResponseCode;

    if (!stkResponse.ok || responseCode !== "0") {
      console.error("❌ STK Push failed", {
        httpStatus: stkResponse.status,
        ResponseCode: responseCode,
        ResponseDescription: (stkData as any)?.ResponseDescription,
        errorMessage: (stkData as any)?.errorMessage,
      });

      // Save failed payment record (best-effort)
      await supabaseClient.from("payments").insert({
        checkout_request_id: (stkData as any)?.CheckoutRequestID || `FAILED-${Date.now()}`,
        merchant_request_id: (stkData as any)?.MerchantRequestID || null,
        phone_number: formattedPhone,
        amount: Math.round(amount),
        account_reference: accountReference,
        transaction_desc: transactionDesc,
        booking_data: bookingData,
        payment_status: "failed",
        result_code: String(responseCode || stkResponse.status),
        result_desc:
          (stkData as any)?.ResponseDescription || (stkData as any)?.errorMessage || "STK Push request failed",
      });

      return jsonResponse({
        success: false,
        error: (stkData as any)?.ResponseDescription || (stkData as any)?.errorMessage || "STK Push failed",
        details: {
          httpStatus: stkResponse.status,
          responseCode,
          baseUrl,
        },
      });
    }

    console.log("✅ STK Push successful, creating pending booking");

    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .insert({
        item_id: bookingData.item_id,
        booking_type: bookingData.booking_type,
        total_amount: bookingData.total_amount,
        booking_details: bookingData.booking_details,
        user_id: bookingData.user_id || null,
        is_guest_booking: bookingData.is_guest_booking || !bookingData.user_id,
        guest_name: bookingData.guest_name,
        guest_email: bookingData.guest_email,
        guest_phone: bookingData.guest_phone || null,
        visit_date: bookingData.visit_date || null,
        slots_booked: bookingData.slots_booked || 1,
        payment_status: "pending",
        payment_method: "mpesa",
        payment_phone: formattedPhone,
        status: "pending",
        referral_tracking_id: bookingData.referral_tracking_id || null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating pending booking:", bookingError);
    } else {
      console.log("✅ Pending booking created:", booking?.id);
    }

    const { error: dbError } = await supabaseClient.from("payments").insert({
      checkout_request_id: (stkData as any).CheckoutRequestID,
      merchant_request_id: (stkData as any).MerchantRequestID,
      phone_number: formattedPhone,
      amount: Math.round(amount),
      account_reference: accountReference,
      transaction_desc: transactionDesc,
      booking_data: {
        ...bookingData,
        booking_id: booking?.id,
        host_id: (item as any).created_by,
      },
      payment_status: "pending",
      user_id: bookingData.user_id || null,
      host_id: (item as any).created_by,
    });

    if (dbError) {
      console.error("Error saving payment:", dbError);
    }

    return jsonResponse({
      success: true,
      message: "STK Push initiated successfully",
      checkoutRequestId: (stkData as any).CheckoutRequestID,
      merchantRequestId: (stkData as any).MerchantRequestID,
      bookingId: booking?.id,
      data: {
        MerchantRequestID: (stkData as any).MerchantRequestID,
        CheckoutRequestID: (stkData as any).CheckoutRequestID,
        ResponseCode: (stkData as any).ResponseCode,
        ResponseDescription: (stkData as any).ResponseDescription,
        CustomerMessage: (stkData as any).CustomerMessage,
      },
    });
  } catch (error) {
    console.error("Error in mpesa-stk-push function:", error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    });
  }
});
