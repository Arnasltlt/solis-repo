-- Grant anonymous read access to reference tables
-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "Allow public read access to access tiers" ON public.access_tiers;
CREATE POLICY "Allow public read access to access tiers"
ON public.access_tiers FOR SELECT
TO anon
USING (true);

-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "Allow public read access to age groups" ON public.age_groups;
CREATE POLICY "Allow public read access to age groups"
ON public.age_groups FOR SELECT
TO anon
USING (true);

-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories"
ON public.categories FOR SELECT
TO anon
USING (true);

-- Adjust content item policies to allow anonymous access to published content
-- Drop existing policy first if it might conflict
DROP POLICY IF EXISTS "View published content" ON public.content_items;

-- Recreate policy for both anon and authenticated
-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "View published content for all users" ON public.content_items;
CREATE POLICY "View published content for all users"
ON public.content_items FOR SELECT
TO anon, authenticated
USING (published = true);

-- Adjust junction table policies for anonymous access to published content links
-- Drop existing policies first
DROP POLICY IF EXISTS "View content age groups for published content" ON public.content_age_groups;
DROP POLICY IF EXISTS "View content categories for published content" ON public.content_categories;

-- Recreate policies for both anon and authenticated
-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "View content age groups for published content for all users" ON public.content_age_groups;
CREATE POLICY "View content age groups for published content for all users"
ON public.content_age_groups FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM content_items
        WHERE content_items.id = content_age_groups.content_id
        AND content_items.published = true
    )
);

-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "View content categories for published content for all users" ON public.content_categories;
CREATE POLICY "View content categories for published content for all users"
ON public.content_categories FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM content_items
        WHERE content_items.id = content_categories.content_id
        AND content_items.published = true
    )
);

-- Optional: Refine authenticated access based on subscription (Example - needs real logic)
-- This is just a placeholder structure. You'll need to adapt the logic based on your 'users' and 'access_tiers' tables/columns.
-- DROP POLICY IF EXISTS "View published content for all users" ON public.content_items;
-- CREATE POLICY "View content based on subscription"
-- ON public.content_items FOR SELECT
-- TO authenticated
-- USING (
--     (published = true AND required_tier_id IS NULL) -- Public content
--     OR
--     (published = true AND required_tier_id IS NOT NULL AND EXISTS ( -- Tiered content
--         SELECT 1 FROM public.users u -- Assuming 'users' table exists with user tiers
--         JOIN public.access_tiers t ON u.subscription_tier_id = t.id
--         WHERE u.id = auth.uid()
--         -- Add logic here to compare user's tier with content's required tier
--         -- e.g., t.level >= (SELECT level FROM public.access_tiers WHERE id = content_items.required_tier_id)
--     ))
-- );

-- Ensure Admin policies grant access even if content is unpublished
-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage all content" ON public.content_items;

-- Recreate admin policy to bypass 'published' check for admins
-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "Admins can manage all content (including unpublished)" ON public.content_items;
CREATE POLICY "Admins can manage all content (including unpublished)"
ON public.content_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
)
WITH CHECK ( -- Ensure admins can also insert/update freely
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Note: You might need similar adjustments for admin policies on junction tables
-- if admins need to manage links for unpublished content.
-- Example for content_age_groups:
DROP POLICY IF EXISTS "Admins can manage content age groups" ON public.content_age_groups;
-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "Admins can manage content age groups (including unpublished links)" ON public.content_age_groups;
CREATE POLICY "Admins can manage content age groups (including unpublished links)"
ON public.content_age_groups FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Example for content_categories:
DROP POLICY IF EXISTS "Admins can manage content categories" ON public.content_categories;
-- Added DROP IF EXISTS for idempotency
DROP POLICY IF EXISTS "Admins can manage content categories (including unpublished links)" ON public.content_categories;
CREATE POLICY "Admins can manage content categories (including unpublished links)"
ON public.content_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Re-evaluate broad GRANTs (Consider removing if policies handle all needed access)
-- The broad `GRANT SELECT ON ALL TABLES TO authenticated` might be unnecessary
-- if the RLS policies correctly define who can select what.
-- Leaving it for now, but could be removed for tighter security if RLS is comprehensive.

-- ***** ADDED: Explicitly GRANT base SELECT permission to anon for public tables *****
GRANT SELECT ON public.access_tiers TO anon;
GRANT SELECT ON public.age_groups TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.content_items TO anon;
GRANT SELECT ON public.content_age_groups TO anon;
GRANT SELECT ON public.content_categories TO anon;
-- ***********************************************************************************

-- Consider granting specific SELECTs instead of broad authenticated grant:
-- REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM authenticated;
-- GRANT SELECT ON public.categories TO authenticated; -- Already granted SELECT to anon above, authenticated inherits implicitly or add explicitly if needed
-- GRANT SELECT ON public.age_groups TO authenticated;
-- GRANT SELECT ON public.access_tiers TO authenticated;
-- GRANT SELECT ON public.content_items TO authenticated; -- RLS will filter rows
-- GRANT SELECT ON public.content_age_groups TO authenticated; -- RLS will filter rows
-- GRANT SELECT ON public.content_categories TO authenticated; -- RLS will filter rows
-- ... grant other necessary permissions ...