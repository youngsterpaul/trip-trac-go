-- Separate address fields in host_verifications table
ALTER TABLE public.host_verifications 
  DROP COLUMN IF EXISTS residential_address;

ALTER TABLE public.host_verifications
  ADD COLUMN street_address TEXT NOT NULL DEFAULT '',
  ADD COLUMN city TEXT NOT NULL DEFAULT '',
  ADD COLUMN postal_code TEXT;