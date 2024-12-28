-- Insert administrator tier if it doesn't exist
INSERT INTO access_tiers (name, level, features)
SELECT 'administrator', 2, '{"description": "Administrator access with full content management capabilities"}'
WHERE NOT EXISTS (SELECT 1 FROM access_tiers WHERE name = 'administrator');

-- Update RLS policies to give administrators full access
CREATE POLICY "Administrators can manage all content"
ON content_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = auth.users.id
        AND auth.users.subscription_tier_id = (SELECT id FROM access_tiers WHERE name = 'administrator')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = auth.users.id
        AND auth.users.subscription_tier_id = (SELECT id FROM access_tiers WHERE name = 'administrator')
    )
);

COMMENT ON TABLE access_tiers IS 'Access tiers for content and user permissions: free, premium, and administrator'; 