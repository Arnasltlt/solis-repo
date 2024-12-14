-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON content_items;
DROP POLICY IF EXISTS "Enable insert for anon" ON content_items;

-- Create policies for content_items
CREATE POLICY "Enable read access for all users"
ON content_items FOR SELECT
USING (published = true);

-- Temporarily allow anonymous inserts for testing
CREATE POLICY "Enable insert for anon"
ON content_items FOR INSERT
WITH CHECK (true);

-- Note: In production, you'll want to restrict this to authenticated users
-- CREATE POLICY "Enable insert for authenticated users"
-- ON content_items FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated');

-- Ensure RLS is enabled
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY; 