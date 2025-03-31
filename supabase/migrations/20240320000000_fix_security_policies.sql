-- Drop ALL existing policies
DROP POLICY IF EXISTS "Show all content" ON content_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON content_items;
DROP POLICY IF EXISTS "Enable insert for anon" ON content_items;
DROP POLICY IF EXISTS "Enable read access for published content" ON content_age_groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content_age_groups;
DROP POLICY IF EXISTS "Enable read access for published content" ON content_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content_categories;
DROP POLICY IF EXISTS "View published content" ON content_items;
DROP POLICY IF EXISTS "Admins can manage all content" ON content_items;
DROP POLICY IF EXISTS "View access tiers" ON access_tiers;
DROP POLICY IF EXISTS "Admins can manage access tiers" ON access_tiers;
DROP POLICY IF EXISTS "View age groups" ON age_groups;
DROP POLICY IF EXISTS "Admins can manage age groups" ON age_groups;
DROP POLICY IF EXISTS "View categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "View content age groups for published content" ON content_age_groups;
DROP POLICY IF EXISTS "Admins can manage content age groups" ON content_age_groups;
DROP POLICY IF EXISTS "View content categories for published content" ON content_categories;
DROP POLICY IF EXISTS "Admins can manage content categories" ON content_categories;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.access_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Content items policies
CREATE POLICY "View published content"
ON public.content_items FOR SELECT
TO authenticated
USING (published = true);

CREATE POLICY "Admins can manage all content"
ON public.content_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Access tiers policies
CREATE POLICY "View access tiers"
ON public.access_tiers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage access tiers"
ON public.access_tiers FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Age groups policies
CREATE POLICY "View age groups"
ON public.age_groups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage age groups"
ON public.age_groups FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Categories policies
CREATE POLICY "View categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Content age groups policies
CREATE POLICY "View content age groups for published content"
ON public.content_age_groups FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM content_items
        WHERE content_items.id = content_age_groups.content_id
        AND content_items.published = true
    )
);

CREATE POLICY "Admins can manage content age groups"
ON public.content_age_groups FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Content categories policies
CREATE POLICY "View content categories for published content"
ON public.content_categories FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM content_items
        WHERE content_items.id = content_categories.content_id
        AND content_items.published = true
    )
);

CREATE POLICY "Admins can manage content categories"
ON public.content_categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'administrator'
    )
);

-- Revoke public access and grant specific permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON content_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON content_age_groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON content_categories TO authenticated;

-- Fix exposed auth users issue by creating a secure view
DROP VIEW IF EXISTS public.users;

-- Create a secure function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'administrator'
  );
$$;

-- Create the users view with proper security
CREATE OR REPLACE FUNCTION public.get_visible_users(user_id uuid)
RETURNS TABLE (
    id uuid,
    email text,
    subscription_tier_id uuid,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    u.id,
    u.email,
    u.subscription_tier_id,
    u.created_at,
    u.updated_at
  FROM auth.users u
  WHERE 
    -- User can see their own data
    u.id = user_id
    -- Admins can see all data
    OR (SELECT public.is_admin());
$$;

-- Create the actual view using the secure function
CREATE OR REPLACE VIEW public.users 
WITH (security_barrier, security_invoker) AS
SELECT * FROM public.get_visible_users(auth.uid());

-- Grant appropriate permissions
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.get_visible_users(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visible_users(uuid) TO authenticated;
GRANT SELECT ON public.users TO authenticated; 