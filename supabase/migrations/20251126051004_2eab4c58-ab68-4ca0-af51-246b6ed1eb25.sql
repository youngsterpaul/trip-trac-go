-- First, update any invalid approval_status values to 'pending' (safe default)
UPDATE hotels SET approval_status = 'pending' 
WHERE approval_status NOT IN ('pending', 'approved', 'rejected', 'removed', 'banned');

UPDATE adventure_places SET approval_status = 'pending'
WHERE approval_status NOT IN ('pending', 'approved', 'rejected', 'removed', 'banned');

UPDATE trips SET approval_status = 'pending'
WHERE approval_status NOT IN ('pending', 'approved', 'rejected', 'removed', 'banned');

UPDATE attractions SET approval_status = 'pending'
WHERE approval_status NOT IN ('pending', 'approved', 'rejected', 'removed', 'banned');

-- Drop existing check constraints if they exist
ALTER TABLE hotels DROP CONSTRAINT IF EXISTS hotels_approval_status_check;
ALTER TABLE adventure_places DROP CONSTRAINT IF EXISTS adventure_places_approval_status_check;
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_approval_status_check;
ALTER TABLE attractions DROP CONSTRAINT IF EXISTS attractions_approval_status_check;

-- Add updated check constraints with all valid statuses
ALTER TABLE hotels 
ADD CONSTRAINT hotels_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

ALTER TABLE adventure_places 
ADD CONSTRAINT adventure_places_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

ALTER TABLE trips 
ADD CONSTRAINT trips_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));

ALTER TABLE attractions 
ADD CONSTRAINT attractions_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'removed', 'banned'));