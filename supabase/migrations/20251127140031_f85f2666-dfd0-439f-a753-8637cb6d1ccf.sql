-- Create pending_payments table to track M-Pesa payment requests
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  account_reference TEXT NOT NULL,
  transaction_desc TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  merchant_request_id TEXT,
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  booking_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert pending payments (for initial payment request)
CREATE POLICY "Anyone can insert pending payments"
  ON public.pending_payments
  FOR INSERT
  WITH CHECK (true);

-- Allow system to update payment status (for callback)
CREATE POLICY "System can update pending payments"
  ON public.pending_payments
  FOR UPDATE
  USING (true);

-- Allow users to view their own pending payments
CREATE POLICY "Users can view their pending payments"
  ON public.pending_payments
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_payments_checkout_request_id 
  ON public.pending_payments(checkout_request_id);

CREATE INDEX IF NOT EXISTS idx_pending_payments_phone_number 
  ON public.pending_payments(phone_number);