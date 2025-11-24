-- Drop existing admin update policy that might be restrictive
DROP POLICY IF EXISTS "Admins can update all adventure places" ON adventure_places;

-- Create comprehensive admin update policy with both USING and WITH CHECK
CREATE POLICY "Admins can update all adventure places"
ON adventure_places
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure admins can also see all items (including pending/rejected)
DROP POLICY IF EXISTS "Public adventure_places read" ON adventure_places;

CREATE POLICY "Public adventure_places read"
ON adventure_places
FOR SELECT
TO authenticated
USING (
  (approval_status = 'approved' AND is_hidden = false) 
  OR auth.uid() = created_by 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public (unauthenticated) to view approved items
CREATE POLICY "Public can view approved adventure places"
ON adventure_places
FOR SELECT
TO anon
USING (approval_status = 'approved' AND is_hidden = false);