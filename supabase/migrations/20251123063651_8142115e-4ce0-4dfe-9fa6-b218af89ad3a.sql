-- Add phone_verified field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment to bank_details table for clarity
COMMENT ON TABLE public.bank_details IS 'Bank details for withdrawal/payout purposes only - NOT for processing customer bookings';

-- Ensure hotels table has working hours fields
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS days_opened TEXT[],
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS closing_hours TEXT;

-- Ensure adventure_places table has working hours fields (already exists based on schema)
-- No changes needed for adventure_places as it already has days_opened, opening_hours, closing_hours

-- Add constraint to ensure at least one image for listings
-- This will be enforced at application level due to complexity of cross-table validation