-- Fix: Remove overly permissive INSERT policy on notifications table
-- Notifications should only be inserted by:
-- 1. Database triggers (SECURITY DEFINER, bypasses RLS)
-- 2. Edge functions using service_role key

-- Drop the permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create a restrictive policy that only allows admin insertions
-- (Triggers and service_role bypass RLS anyway, so this is just a safety net)
CREATE POLICY "Only admins can insert notifications" ON notifications
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));