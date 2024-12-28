-- Create access_tiers table if it doesn't exist
CREATE TABLE IF NOT EXISTS access_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tiers if they don't exist
INSERT INTO access_tiers (name, level, features)
SELECT 'free', 0, '{"description": "Free content available to all users"}'
WHERE NOT EXISTS (SELECT 1 FROM access_tiers WHERE name = 'free');

INSERT INTO access_tiers (name, level, features)
SELECT 'premium', 1, '{"description": "Premium content for subscribed users"}'
WHERE NOT EXISTS (SELECT 1 FROM access_tiers WHERE name = 'premium');

-- Store the free tier ID for use in later statements
DO $$
DECLARE
    free_tier_id UUID;
BEGIN
    SELECT id INTO free_tier_id FROM access_tiers WHERE name = 'free';

    -- Add access_tier_id to content_items if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'content_items'
        AND column_name = 'access_tier_id'
    ) THEN
        ALTER TABLE content_items
        ADD COLUMN access_tier_id UUID REFERENCES access_tiers(id);

        -- Set default access tier for existing content
        UPDATE content_items
        SET access_tier_id = free_tier_id
        WHERE access_tier_id IS NULL;

        -- Make access_tier_id non-nullable
        ALTER TABLE content_items
        ALTER COLUMN access_tier_id SET NOT NULL;
    END IF;
END $$;

-- Add RLS policies for access_tiers
ALTER TABLE access_tiers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Access tiers are viewable by everyone" ON access_tiers;
DROP POLICY IF EXISTS "Only super admins can modify access tiers" ON access_tiers;

-- Everyone can read access tiers
CREATE POLICY "Access tiers are viewable by everyone"
ON access_tiers FOR SELECT
TO public
USING (true);

-- Only super admins can modify access tiers
CREATE POLICY "Only super admins can modify access tiers"
ON access_tiers FOR ALL
TO authenticated
USING (
    auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
);

-- Create a function to handle default access tier
CREATE OR REPLACE FUNCTION get_default_access_tier()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    default_tier_id UUID;
BEGIN
    SELECT id INTO default_tier_id FROM access_tiers WHERE name = 'free';
    RETURN default_tier_id;
END;
$$;

-- Set the default value using the function
ALTER TABLE content_items
ALTER COLUMN access_tier_id SET DEFAULT get_default_access_tier();

-- Drop the users view if it exists
DROP VIEW IF EXISTS users;

-- Create a view to access user data
CREATE OR REPLACE VIEW users AS
SELECT 
    id,
    email,
    subscription_tier_id
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Add RLS policy to the view
ALTER VIEW users SET (security_invoker = true); 