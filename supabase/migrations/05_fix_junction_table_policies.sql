-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON content_age_groups;
DROP POLICY IF EXISTS "Enable read access for all users" ON content_categories;

-- Create more specific policies for content_age_groups
CREATE POLICY "Enable read access for published content" ON content_age_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM content_items
            WHERE content_items.id = content_age_groups.content_id
            AND content_items.published = true
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON content_age_groups
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM content_items
            WHERE content_items.id = content_id
            AND content_items.author_id = auth.uid()
        )
    );

-- Create more specific policies for content_categories
CREATE POLICY "Enable read access for published content" ON content_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM content_items
            WHERE content_items.id = content_categories.content_id
            AND content_items.published = true
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON content_categories
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM content_items
            WHERE content_items.id = content_id
            AND content_items.author_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON content_age_groups TO anon, authenticated;
GRANT SELECT ON content_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON content_age_groups TO authenticated;
GRANT INSERT, UPDATE, DELETE ON content_categories TO authenticated; 