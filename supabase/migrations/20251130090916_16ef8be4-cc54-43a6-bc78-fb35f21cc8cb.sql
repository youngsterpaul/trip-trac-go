-- Fix security warning: Set search_path for reconcile_mpesa_payment function
CREATE OR REPLACE FUNCTION public.reconcile_mpesa_payment()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_payment_id UUID;
  v_booking_data JSONB;
  v_booking_id UUID;
  v_host_id UUID;
BEGIN
  -- Find the corresponding pending payment
  SELECT id, booking_data 
  INTO v_pending_payment_id, v_booking_data
  FROM public.pending_payments
  WHERE checkout_request_id = NEW.checkout_request_id
  LIMIT 1;

  IF v_pending_payment_id IS NULL THEN
    RAISE NOTICE 'No pending payment found for checkout_request_id: %', NEW.checkout_request_id;
    RETURN NEW;
  END IF;

  -- Update the callback log with pending_payment_id reference
  UPDATE public.mpesa_callback_log
  SET pending_payment_id = v_pending_payment_id
  WHERE id = NEW.id;

  -- Process based on result code
  IF NEW.result_code = '0' THEN
    -- SUCCESS: Update pending payment status
    UPDATE public.pending_payments
    SET 
      payment_status = 'completed',
      result_code = NEW.result_code,
      result_desc = NEW.result_desc,
      mpesa_receipt_number = (NEW.raw_payload->'Body'->'stkCallback'->'CallbackMetadata'->'Item'->0->>'Value'),
      updated_at = now()
    WHERE id = v_pending_payment_id;

    -- Create the booking with PAID status
    INSERT INTO public.bookings (
      user_id,
      item_id,
      booking_type,
      booking_details,
      total_amount,
      payment_status,
      payment_method,
      payment_phone,
      guest_name,
      guest_email,
      guest_phone,
      is_guest_booking,
      visit_date,
      slots_booked,
      referral_tracking_id,
      status
    )
    SELECT 
      (v_booking_data->>'user_id')::UUID,
      (v_booking_data->>'item_id')::UUID,
      v_booking_data->>'booking_type',
      v_booking_data->'booking_details',
      (v_booking_data->>'total_amount')::NUMERIC,
      'paid',
      'mpesa',
      (SELECT phone_number FROM public.pending_payments WHERE id = v_pending_payment_id),
      v_booking_data->>'guest_name',
      v_booking_data->>'guest_email',
      v_booking_data->>'guest_phone',
      COALESCE((v_booking_data->>'is_guest_booking')::BOOLEAN, false),
      (v_booking_data->>'visit_date')::DATE,
      COALESCE((v_booking_data->>'slots_booked')::INTEGER, 1),
      (v_booking_data->>'referral_tracking_id')::UUID,
      'confirmed'
    RETURNING id, (v_booking_data->>'item_id')::UUID INTO v_booking_id, v_host_id;

    RAISE NOTICE 'Booking created successfully with ID: %', v_booking_id;

  ELSIF NEW.result_code != '1032' THEN
    -- FAILURE (but not pending/timeout): Update pending payment status
    UPDATE public.pending_payments
    SET 
      payment_status = 'failed',
      result_code = NEW.result_code,
      result_desc = NEW.result_desc,
      updated_at = now()
    WHERE id = v_pending_payment_id;

    RAISE NOTICE 'Payment failed with result code: %', NEW.result_code;
  ELSE
    -- PENDING (1032): Do not update status, keep as pending
    RAISE NOTICE 'Payment still pending with result code: %', NEW.result_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;