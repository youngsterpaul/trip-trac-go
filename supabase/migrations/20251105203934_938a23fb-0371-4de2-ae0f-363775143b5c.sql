-- Update approval_status check constraints to include 'removed' and 'banned'
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_approval_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

ALTER TABLE events DROP CONSTRAINT IF EXISTS events_approval_status_check;
ALTER TABLE events ADD CONSTRAINT events_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

ALTER TABLE hotels DROP CONSTRAINT IF EXISTS hotels_approval_status_check;
ALTER TABLE hotels ADD CONSTRAINT hotels_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

ALTER TABLE adventure_places DROP CONSTRAINT IF EXISTS adventure_places_approval_status_check;
ALTER TABLE adventure_places ADD CONSTRAINT adventure_places_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

-- Function to check listing limit (one per category per user)
CREATE OR REPLACE FUNCTION check_listing_limit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers for listing limits
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