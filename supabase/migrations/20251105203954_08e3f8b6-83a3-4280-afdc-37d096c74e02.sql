-- Fix function search path for check_listing_limit
DROP FUNCTION IF EXISTS check_listing_limit() CASCADE;

CREATE OR REPLACE FUNCTION check_listing_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has a listing in this category
  IF TG_TABLE_NAME = 'trips' THEN
    IF EXISTS (SELECT 1 FROM trips WHERE created_by = NEW.created_by AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      RAISE EXCEPTION 'You can only create one trip listing';
    END IF;
  ELSIF TG_TABLE_NAME = 'events' THEN
    IF EXISTS (SELECT 1 FROM events WHERE created_by = NEW.created_by AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      RAISE EXCEPTION 'You can only create one event listing';
    END IF;
  ELSIF TG_TABLE_NAME = 'hotels' THEN
    IF EXISTS (SELECT 1 FROM hotels WHERE created_by = NEW.created_by AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      RAISE EXCEPTION 'You can only create one hotel/accommodation listing';
    END IF;
  ELSIF TG_TABLE_NAME = 'adventure_places' THEN
    IF EXISTS (SELECT 1 FROM adventure_places WHERE created_by = NEW.created_by AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      RAISE EXCEPTION 'You can only create one adventure place listing';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
DROP TRIGGER IF EXISTS check_trip_limit ON trips;
CREATE TRIGGER check_trip_limit
  BEFORE INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION check_listing_limit();

DROP TRIGGER IF EXISTS check_event_limit ON events;
CREATE TRIGGER check_event_limit
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_listing_limit();

DROP TRIGGER IF EXISTS check_hotel_limit ON hotels;
CREATE TRIGGER check_hotel_limit
  BEFORE INSERT ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION check_listing_limit();

DROP TRIGGER IF EXISTS check_adventure_place_limit ON adventure_places;
CREATE TRIGGER check_adventure_place_limit
  BEFORE INSERT ON adventure_places
  FOR EACH ROW
  EXECUTE FUNCTION check_listing_limit();