-- Create mpesa_callback_log table for tracking all M-Pesa callbacks
CREATE TABLE public.mpesa_callback_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_request_id TEXT NOT NULL,
  merchant_request_id TEXT,
  result_code TEXT,
  result_desc TEXT,
  mpesa_receipt_number TEXT,
  amount NUMERIC,
  phone_number TEXT,
  raw_callback JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mpesa_callback_log ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert (edge functions)
CREATE POLICY "Service role can insert callback logs"
ON public.mpesa_callback_log
FOR INSERT
WITH CHECK (true);

-- Only admins can view callback logs
CREATE POLICY "Admins can view callback logs"
ON public.mpesa_callback_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_mpesa_callback_log_checkout_request_id 
ON public.mpesa_callback_log(checkout_request_id);

CREATE INDEX idx_mpesa_callback_log_created_at 
ON public.mpesa_callback_log(created_at DESC);