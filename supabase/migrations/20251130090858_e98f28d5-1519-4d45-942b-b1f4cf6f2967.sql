-- Create M-Pesa Callback Log table for storing raw M-Pesa confirmations
CREATE TABLE IF NOT EXISTS public.mpesa_callback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id TEXT NOT NULL,
  merchant_request_id TEXT,
  result_code TEXT NOT NULL,
  result_desc TEXT,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pending_payment_id UUID REFERENCES public.pending_payments(id),
  CONSTRAINT fk_pending_payment FOREIGN KEY (pending_payment_id) 
    REFERENCES public.pending_payments(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_mpesa_callback_checkout_request ON public.mpesa_callback_log(checkout_request_id);
CREATE INDEX idx_mpesa_callback_pending_payment ON public.mpesa_callback_log(pending_payment_id);

-- Enable realtime for instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.mpesa_callback_log;

-- Update pending_payments to serve as proper API Request Log
ALTER TABLE public.pending_payments 
  ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS host_id UUID,
  ADD COLUMN IF NOT EXISTS stk_push_sent BOOLEAN DEFAULT false;

-- Create reconciliation trigger function
CREATE OR REPLACE FUNCTION public.reconcile_mpesa_payment()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on callback log insertion
DROP TRIGGER IF EXISTS trigger_reconcile_mpesa_payment ON public.mpesa_callback_log;
CREATE TRIGGER trigger_reconcile_mpesa_payment
  AFTER INSERT ON public.mpesa_callback_log
  FOR EACH ROW
  EXECUTE FUNCTION public.reconcile_mpesa_payment();

-- Update RLS policies for callback log (system use only)
ALTER TABLE public.mpesa_callback_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert callback logs"
  ON public.mpesa_callback_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can view callback logs"
  ON public.mpesa_callback_log FOR SELECT
  USING (true);

-- Update bookings RLS to ensure hosts only see PAID bookings
DROP POLICY IF EXISTS "Creators can view bookings for their items" ON public.bookings;
CREATE POLICY "Creators can view confirmed paid bookings for their items"
  ON public.bookings FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (is_guest_booking AND payment_phone IS NOT NULL) OR
    (payment_status = 'paid' AND EXISTS (
      SELECT 1 FROM trips WHERE trips.id = bookings.item_id AND trips.created_by = auth.uid()
      UNION ALL
      SELECT 1 FROM hotels WHERE hotels.id = bookings.item_id AND hotels.created_by = auth.uid()
      UNION ALL
      SELECT 1 FROM adventure_places WHERE adventure_places.id = bookings.item_id AND adventure_places.created_by = auth.uid()
      UNION ALL
      SELECT 1 FROM attractions WHERE attractions.id = bookings.item_id AND attractions.created_by = auth.uid()
    ))
  );

-- Enable realtime on bookings (replica identity)
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Enable realtime on pending_payments (replica identity)
ALTER TABLE public.pending_payments REPLICA IDENTITY FULL;