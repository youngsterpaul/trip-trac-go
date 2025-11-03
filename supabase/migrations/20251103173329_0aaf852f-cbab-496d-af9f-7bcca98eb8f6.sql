-- Fix business_accounts RLS policy for insertion
-- The issue is that new users don't have the business role yet when inserting

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Business users can insert their own account" ON public.business_accounts;

-- Create a new INSERT policy that allows any authenticated user to insert their own account
-- The trigger will assign the business role after insertion
CREATE POLICY "Users can insert their own business account"
ON public.business_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);