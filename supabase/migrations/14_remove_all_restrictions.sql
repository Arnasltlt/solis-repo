-- Disable RLS on all tables
ALTER TABLE content_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_age_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE age_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_tiers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access" ON content_items;
DROP POLICY IF EXISTS "Allow authenticated read access" ON content_items;
DROP POLICY IF EXISTS "Allow admin write access" ON content_items;
DROP POLICY IF EXISTS "Allow public read access" ON content_age_groups;
DROP POLICY IF EXISTS "Allow public read access" ON content_categories;
DROP POLICY IF EXISTS "Allow public read access" ON age_groups;
DROP POLICY IF EXISTS "Allow public read access" ON categories;
DROP POLICY IF EXISTS "Allow public read access" ON access_tiers; 