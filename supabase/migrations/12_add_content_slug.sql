-- Add slug column to content_items
ALTER TABLE content_items
ADD COLUMN slug TEXT UNIQUE;

-- Create a function to generate a slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  result_slug TEXT;
  base_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Convert to lowercase and replace spaces and special characters with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  
  -- Try the base slug first
  result_slug := base_slug;
  
  -- If slug exists, append a number until we find a unique one
  WHILE EXISTS (SELECT 1 FROM content_items WHERE slug = result_slug) LOOP
    result_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN result_slug;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically generate slug on insert if not provided
CREATE OR REPLACE FUNCTION set_content_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_slug_trigger
BEFORE INSERT ON content_items
FOR EACH ROW
EXECUTE FUNCTION set_content_slug();

-- Generate slugs for existing content
UPDATE content_items
SET slug = generate_slug(title)
WHERE slug IS NULL; 