-- Add content_body column to content_items table
ALTER TABLE content_items
ADD COLUMN content_body TEXT;

-- Update RLS policy to include content_body in readable fields
DROP POLICY IF EXISTS "Enable read access for all users" ON content_items;
CREATE POLICY "Enable read access for all users" ON content_items
    FOR SELECT USING (published = true); 