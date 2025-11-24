-- Add triggers for item status change notifications including unhidden status
-- This ensures notifications are sent when items are hidden or unhidden

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_on_trip_status_change ON trips;
DROP TRIGGER IF EXISTS notify_on_hotel_status_change ON hotels;
DROP TRIGGER IF EXISTS notify_on_adventure_place_status_change ON adventure_places;
DROP TRIGGER IF EXISTS notify_on_attraction_status_change ON attractions;

-- Create triggers for trips
CREATE TRIGGER notify_on_trip_status_change
AFTER UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION notify_on_item_status_change();

-- Create triggers for hotels
CREATE TRIGGER notify_on_hotel_status_change
AFTER UPDATE ON hotels
FOR EACH ROW
EXECUTE FUNCTION notify_on_item_status_change();

-- Create triggers for adventure_places
CREATE TRIGGER notify_on_adventure_place_status_change
AFTER UPDATE ON adventure_places
FOR EACH ROW
EXECUTE FUNCTION notify_on_item_status_change();

-- Create triggers for attractions
CREATE TRIGGER notify_on_attraction_status_change
AFTER UPDATE ON attractions
FOR EACH ROW
EXECUTE FUNCTION notify_on_attraction_status_change();