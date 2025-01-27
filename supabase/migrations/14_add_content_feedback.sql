-- Create content_feedback table
CREATE TABLE content_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    used_in_class BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

-- Add RLS policies
ALTER TABLE content_feedback ENABLE ROW LEVEL SECURITY;

-- Everyone can view feedback counts
CREATE POLICY "Anyone can view feedback"
ON content_feedback FOR SELECT
TO public
USING (true);

-- Only authenticated users can give feedback
CREATE POLICY "Only authenticated users can give feedback"
ON content_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own feedback
CREATE POLICY "Users can update their own feedback"
ON content_feedback FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
ON content_feedback FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add function to get feedback count for content
CREATE OR REPLACE FUNCTION get_content_feedback_count(content_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM content_feedback
        WHERE content_feedback.content_id = $1
        AND used_in_class = true
    );
END;
$$;

-- Update database types documentation
COMMENT ON TABLE content_feedback IS 'Stores user feedback about content usage in class';
COMMENT ON COLUMN content_feedback.used_in_class IS 'Indicates if the user has used this content in their class'; 