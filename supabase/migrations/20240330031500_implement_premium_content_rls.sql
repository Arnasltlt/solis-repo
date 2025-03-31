-- Drop existing SELECT policies that we are replacing
DROP POLICY IF EXISTS "View published content for all users" ON public.content_items;
-- DROP POLICY IF EXISTS "Allow public read access to access tiers" ON public.access_tiers; -- Keep this? Yes, tiers themselves should be public? Re-add if dropped.
-- DROP POLICY IF EXISTS "Allow public read access to age groups" ON public.age_groups; -- Keep this
-- DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories; -- Keep this
DROP POLICY IF EXISTS "View content age groups for published content for all users" ON public.content_age_groups;
DROP POLICY IF EXISTS "View content categories for published content for all users" ON public.content_categories;

-- Ensure reference tables are still readable by anon/authenticated (in case they were dropped above)
-- Idempotency: Add DROP IF EXISTS
DROP POLICY IF EXISTS "Allow public read access to access tiers" ON public.access_tiers;
CREATE POLICY "Allow public read access to access tiers"
ON public.access_tiers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read access to age groups" ON public.age_groups;
CREATE POLICY "Allow public read access to age groups"
ON public.age_groups FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories"
ON public.categories FOR SELECT TO anon, authenticated USING (true);


-- ==== Content Items Policies ====

-- Policy 1: Admins have full access (reaffirm, ensure it uses is_admin() if possible)
DROP POLICY IF EXISTS "Admins can manage all content (including unpublished)" ON public.content_items;
CREATE POLICY "Admins can manage all content (including unpublished)"
ON public.content_items FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 2: Non-admins SELECT based on published status ONLY (REVISED - More Permissive)
DROP POLICY IF EXISTS "Allow view access based on published status" ON public.content_items;
DROP POLICY IF EXISTS "Allow view access based on published status and tier" ON public.content_items; -- Drop old name too
CREATE POLICY "Allow view access based on published status"
ON public.content_items FOR SELECT
TO anon, authenticated
USING (
    -- Simplified: Only check published status and NOT admin. Tier logic removed.
    published = true AND NOT public.is_admin()
);


-- ==== Content Age Groups Policies (Junction Table) ====

-- Policy 1: Admins have full access to links
DROP POLICY IF EXISTS "Admins can manage content age groups (including unpublished links)" ON public.content_age_groups;
CREATE POLICY "Admins can manage content age groups (including unpublished links)"
ON public.content_age_groups FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 2: Non-admins SELECT links based on target content PUBLISHED status ONLY (REVISED - More Permissive)
DROP POLICY IF EXISTS "Allow view access to links based on published status" ON public.content_age_groups;
DROP POLICY IF EXISTS "Allow view access to links based on target content" ON public.content_age_groups; -- Drop old name too
CREATE POLICY "Allow view access to links based on published status"
ON public.content_age_groups FOR SELECT
TO anon, authenticated
USING (
    NOT public.is_admin()
    AND EXISTS ( -- And the linked content item is published
        SELECT 1 FROM public.content_items ci
        WHERE ci.id = content_age_groups.content_id
          AND ci.published = true
          -- Tier check removed.
    )
);


-- ==== Content Categories Policies (Junction Table) ====

-- Policy 1: Admins have full access to links
DROP POLICY IF EXISTS "Admins can manage content categories (including unpublished links)" ON public.content_categories;
CREATE POLICY "Admins can manage content categories (including unpublished links)"
ON public.content_categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 2: Non-admins SELECT links based on target content PUBLISHED status ONLY (REVISED - More Permissive)
DROP POLICY IF EXISTS "Allow view access to links based on published status" ON public.content_categories;
DROP POLICY IF EXISTS "Allow view access to links based on target content" ON public.content_categories; -- Drop old name too
CREATE POLICY "Allow view access to links based on published status"
ON public.content_categories FOR SELECT
TO anon, authenticated
USING (
    NOT public.is_admin()
    AND EXISTS ( -- And the linked content item is published
        SELECT 1 FROM public.content_items ci
        WHERE ci.id = content_categories.content_id
          AND ci.published = true
          -- Tier check removed.
    )
);

-- Ensure base SELECT grants still exist (redundant if previous script ran, but safe)
GRANT SELECT ON public.access_tiers TO anon, authenticated;
GRANT SELECT ON public.age_groups TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.content_items TO anon, authenticated;
GRANT SELECT ON public.content_age_groups TO anon, authenticated;
GRANT SELECT ON public.content_categories TO anon, authenticated; 