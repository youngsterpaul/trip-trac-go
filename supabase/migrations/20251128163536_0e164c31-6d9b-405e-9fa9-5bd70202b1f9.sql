-- Create reschedule_log table to track booking date changes
CREATE TABLE IF NOT EXISTS public.reschedule_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  old_date DATE NOT NULL,
  new_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on reschedule_log
ALTER TABLE public.reschedule_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own reschedule logs
CREATE POLICY "Users can view their own reschedule logs"
ON public.reschedule_log
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all reschedule logs
CREATE POLICY "Admins can view all reschedule logs"
ON public.reschedule_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert reschedule logs
CREATE POLICY "System can insert reschedule logs"
ON public.reschedule_log
FOR INSERT
WITH CHECK (true);

-- Add is_flexible_date column to trips table to track flexible vs fixed date trips
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS is_flexible_date BOOLEAN DEFAULT false;

-- Create index for faster reschedule log queries
CREATE INDEX IF NOT EXISTS idx_reschedule_log_booking_id ON public.reschedule_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_log_user_id ON public.reschedule_log(user_id);