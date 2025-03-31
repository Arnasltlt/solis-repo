-- Migration: Create security definer function for tier check and grant execute

-- 1. Create the user_matches_tier function
CREATE OR REPLACE FUNCTION public.user_matches_tier(tier_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
-- Set a secure search_path: IMPORTANT prevents search_path attacks
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.subscription_tier_id = tier_id
  );
$$;

-- 2. Grant EXECUTE permission on the new function to authenticated users
GRANT EXECUTE
ON FUNCTION public.user_matches_tier(uuid)
TO authenticated;

-- 3. Reaffirm EXECUTE permission on is_admin() just in case
GRANT EXECUTE
ON FUNCTION public.is_admin()
TO authenticated; 