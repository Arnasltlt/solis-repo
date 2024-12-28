-- Add subscription_tier_id to users table
ALTER TABLE auth.users 
ADD COLUMN subscription_tier_id UUID REFERENCES public.access_tiers(id);

-- Set default subscription tier for existing users
DO $$
DECLARE
    free_tier_id UUID;
BEGIN
    -- Get the free tier ID
    SELECT id INTO free_tier_id FROM public.access_tiers WHERE name = 'free';

    -- Update all existing users to free tier
    UPDATE auth.users
    SET subscription_tier_id = free_tier_id;
END $$;

-- Make subscription_tier_id non-nullable and set default
ALTER TABLE auth.users
ALTER COLUMN subscription_tier_id SET NOT NULL;

-- Create a function to get default subscription tier
CREATE OR REPLACE FUNCTION auth.get_default_subscription_tier()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    default_tier_id UUID;
BEGIN
    SELECT id INTO default_tier_id FROM public.access_tiers WHERE name = 'free';
    RETURN default_tier_id;
END;
$$;

-- Set default value for new users
ALTER TABLE auth.users
ALTER COLUMN subscription_tier_id SET DEFAULT auth.get_default_subscription_tier(); 