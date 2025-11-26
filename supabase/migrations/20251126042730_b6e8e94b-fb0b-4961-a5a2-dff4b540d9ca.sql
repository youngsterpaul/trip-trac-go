-- Add facilities column to attractions table
ALTER TABLE attractions 
ADD COLUMN IF NOT EXISTS facilities jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN attractions.facilities IS 'Array of facility objects with name, price, and capacity';

-- Update adventure_places facilities to ensure they support capacity
COMMENT ON COLUMN adventure_places.facilities IS 'Array of facility objects with name, price, and capacity';

-- Update hotels facilities comment
COMMENT ON COLUMN hotels.facilities IS 'Array of facility objects with name, price, and capacity';