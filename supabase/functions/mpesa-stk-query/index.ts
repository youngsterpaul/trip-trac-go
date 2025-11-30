import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKQueryRequest {
  checkoutRequestId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { checkoutRequestId }: STKQueryRequest = await req.json();
    console.log('STK Query request received for:', checkoutRequestId);

    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');

    if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
      throw new Error('M-Pesa credentials not configured');
    }

    // Step 1: Get OAuth token
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get OAuth token');
    }

    const { access_token } = await tokenResponse.json();
    console.log('OAuth token obtained for STK Query');

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Step 3: Query STK Push status
    const queryPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    console.log('Querying STK status:', { checkoutRequestId });

    const queryResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryPayload),
      }
    );

    const queryData = await queryResponse.json();
    console.log('STK Query response:', queryData);

    // Check if it's a rate limit error
    if (queryData.fault?.detail?.errorcode === 'policies.ratelimit.SpikeArrestViolation') {
      console.log('Rate limit hit - will retry later');
      return new Response(
        JSON.stringify({
          success: false,
          resultCode: 'RATE_LIMIT',
          resultDesc: 'Rate limit exceeded, please try again in a moment',
          responseDescription: 'Too many requests to M-Pesa API',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Update database based on query result
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Transform query response to match callback structure
    const syntheticPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'QUERY',
          CheckoutRequestID: checkoutRequestId,
          ResultCode: queryData.ResultCode || '1032',
          ResultDesc: queryData.ResultDesc || 'Request in progress',
          CallbackMetadata: queryData.CallbackMetadata || null,
        }
      }
    };

    // Insert into callback log - trigger will handle everything
    const { error: logError } = await supabaseClient
      .from('mpesa_callback_log')
      .insert({
        checkout_request_id: checkoutRequestId,
        merchant_request_id: 'QUERY',
        result_code: (queryData.ResultCode || '1032').toString(),
        result_desc: queryData.ResultDesc || 'Query result',
        raw_payload: syntheticPayload,
      });

    if (logError) {
      console.error('Error inserting query result to callback log:', logError);
    } else {
      console.log('Query result logged - trigger will process reconciliation');
    }

    return new Response(
      JSON.stringify({
        success: true,
        resultCode: queryData.ResultCode,
        resultDesc: queryData.ResultDesc,
        responseDescription: queryData.ResponseDescription,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in mpesa-stk-query function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
