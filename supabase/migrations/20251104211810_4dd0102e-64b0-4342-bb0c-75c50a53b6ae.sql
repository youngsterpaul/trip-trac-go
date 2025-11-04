-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('user-content-images', 'user-content-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('profile-photos', 'profile-photos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-content-images
CREATE POLICY "Authenticated users can upload content images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-content-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view content images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-content-images');

CREATE POLICY "Users can update their own content images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-content-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own content images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-content-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for profile-photos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update adventure_places table
ALTER TABLE adventure_places 
ADD COLUMN IF NOT EXISTS map_link text,
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT ARRAY[]::text[];

-- Update facilities to include price (convert to jsonb array with name and price)
-- activities already has the right structure, just need to add price field

-- Update hotels table
ALTER TABLE hotels 
ADD COLUMN IF NOT EXISTS map_link text,
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT ARRAY[]::text[];

-- Update facilities to include price structure

-- Update trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS map_link text,
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS date_type text DEFAULT 'fixed' CHECK (date_type IN ('fixed', 'custom'));

-- Update events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS map_link text,
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT ARRAY[]::text[];

-- Update bookings table to include more details
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS slots_booked integer DEFAULT 1;

-- Add index for faster booking queries by creator
CREATE INDEX IF NOT EXISTS idx_bookings_item_id ON bookings(item_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_hotels_created_by ON hotels(created_by);
CREATE INDEX IF NOT EXISTS idx_adventure_places_created_by ON adventure_places(created_by);