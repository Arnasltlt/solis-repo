-- Add content_body column for rich text content
ALTER TABLE content_items
ADD COLUMN content_body TEXT;

-- First ensure we handle existing data
UPDATE content_items
SET type = 'audio'
WHERE type = 'song';

-- Rename audio_url to song_url for consistency
ALTER TABLE content_items
RENAME COLUMN audio_url TO song_url;

-- Add sheet_music_url for song type
ALTER TABLE content_items
ADD COLUMN sheet_music_url TEXT;

-- Add content_images array to metadata
UPDATE content_items
SET metadata = metadata || 
  jsonb_build_object(
    'content_images', '[]'::jsonb,
    'embed_links', '[]'::jsonb,
    'attachments', '[]'::jsonb
  )
WHERE metadata IS NULL OR 
      NOT metadata ? 'content_images' OR 
      NOT metadata ? 'embed_links' OR
      NOT metadata ? 'attachments';

-- Create a function to validate metadata structure
CREATE OR REPLACE FUNCTION validate_content_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure metadata has required structure
  IF NEW.metadata IS NULL THEN
    NEW.metadata := jsonb_build_object(
      'content_images', '[]'::jsonb,
      'embed_links', '[]'::jsonb,
      'attachments', '[]'::jsonb
    );
  ELSE
    IF NOT NEW.metadata ? 'content_images' THEN
      NEW.metadata := NEW.metadata || jsonb_build_object('content_images', '[]'::jsonb);
    END IF;
    IF NOT NEW.metadata ? 'embed_links' THEN
      NEW.metadata := NEW.metadata || jsonb_build_object('embed_links', '[]'::jsonb);
    END IF;
    IF NOT NEW.metadata ? 'attachments' THEN
      NEW.metadata := NEW.metadata || jsonb_build_object('attachments', '[]'::jsonb);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure metadata structure
DROP TRIGGER IF EXISTS ensure_content_metadata ON content_items;
CREATE TRIGGER ensure_content_metadata
  BEFORE INSERT OR UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_content_metadata();

-- Update the type constraint
ALTER TABLE content_items 
DROP CONSTRAINT IF EXISTS content_items_type_check;

ALTER TABLE content_items
ADD CONSTRAINT content_items_type_check 
CHECK (type IN ('video', 'audio', 'lesson_plan', 'game'));
 