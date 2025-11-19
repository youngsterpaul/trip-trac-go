-- Remove access PIN and hashed PIN columns from hotels table
ALTER TABLE public.hotels 
DROP COLUMN IF EXISTS access_pin,
DROP COLUMN IF EXISTS hashed_access_pin;

-- Remove access PIN and hashed PIN columns from adventure_places table
ALTER TABLE public.adventure_places 
DROP COLUMN IF EXISTS access_pin,
DROP COLUMN IF EXISTS hashed_access_pin;