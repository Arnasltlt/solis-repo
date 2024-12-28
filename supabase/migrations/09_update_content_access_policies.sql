-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON content_items;
DROP POLICY IF EXISTS "Enable insert for anon" ON content_items;
DROP POLICY IF EXISTS "Enable read access for free content" ON content_items;
DROP POLICY IF EXISTS "Enable read access for premium content" ON content_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content_items;
DROP POLICY IF EXISTS "Content access based on tier" ON content_items;
DROP POLICY IF EXISTS "Content access policy" ON content_items;
DROP POLICY IF EXISTS "Show free content" ON content_items;

DROP POLICY IF EXISTS "Public read age_groups" ON age_groups;
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Public read content_age_groups" ON content_age_groups;
DROP POLICY IF EXISTS "Public read content_categories" ON content_categories;
DROP POLICY IF EXISTS "Public read access_tiers" ON access_tiers;
DROP POLICY IF EXISTS "Allow reading age groups" ON age_groups;
DROP POLICY IF EXISTS "Allow reading categories" ON categories;
DROP POLICY IF EXISTS "Allow reading content age groups" ON content_age_groups;
DROP POLICY IF EXISTS "Allow reading content categories" ON content_categories;
DROP POLICY IF EXISTS "Allow reading access tiers" ON access_tiers;

-- Show all published content to everyone
CREATE POLICY "Show all content"
ON content_items FOR SELECT
TO public
USING (published = true);

-- Create policy for content creation
CREATE POLICY "Enable insert for authenticated users"
ON content_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable RLS on related tables
ALTER TABLE content_age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tiers ENABLE ROW LEVEL SECURITY;

-- Simple read policies for supporting tables
CREATE POLICY "Public read age_groups" ON age_groups FOR SELECT TO public USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Public read content_age_groups" ON content_age_groups FOR SELECT TO public USING (true);
CREATE POLICY "Public read content_categories" ON content_categories FOR SELECT TO public USING (true);
CREATE POLICY "Public read access_tiers" ON access_tiers FOR SELECT TO public USING (true); 