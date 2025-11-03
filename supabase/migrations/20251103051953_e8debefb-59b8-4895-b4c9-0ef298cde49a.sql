-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-images', 'profile-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('listing-images', 'listing-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]);

-- Storage policies for profile images
CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own profile image"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for listing images (public read)
CREATE POLICY "Anyone can view listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

-- Add images array to existing tables
ALTER TABLE trips ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Add capacity/availability tracking
ALTER TABLE trips ADD COLUMN IF NOT EXISTS available_tickets integer DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS price_child numeric DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE events ADD COLUMN IF NOT EXISTS available_tickets integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_vip numeric DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_vvip numeric DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_regular numeric DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price_child numeric DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS email text;

-- Add facilities and contact info to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS phone_numbers text[] DEFAULT ARRAY[]::text[];
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS facilities jsonb DEFAULT '[]'::jsonb;

-- Add facilities and activities to adventure places
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS phone_numbers text[] DEFAULT ARRAY[]::text[];
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS entry_fee numeric DEFAULT 0;
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS entry_fee_type text DEFAULT 'free';
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS facilities jsonb DEFAULT '[]'::jsonb;
ALTER TABLE adventure_places ADD COLUMN IF NOT EXISTS activities jsonb DEFAULT '[]'::jsonb;

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('trip', 'event', 'hotel', 'adventure_place')),
  item_id uuid NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_method text CHECK (payment_method IN ('mpesa', 'airtel', 'card')),
  payment_phone text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  booking_details jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();