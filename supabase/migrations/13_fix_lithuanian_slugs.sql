-- Drop existing function and recreate with proper character handling
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  result_slug TEXT;
  base_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- First, replace Lithuanian characters with their ASCII equivalents
  base_slug := title;
  base_slug := replace(base_slug, 'ą', 'a');
  base_slug := replace(base_slug, 'č', 'c');
  base_slug := replace(base_slug, 'ę', 'e');
  base_slug := replace(base_slug, 'ė', 'e');
  base_slug := replace(base_slug, 'į', 'i');
  base_slug := replace(base_slug, 'š', 's');
  base_slug := replace(base_slug, 'ų', 'u');
  base_slug := replace(base_slug, 'ū', 'u');
  base_slug := replace(base_slug, 'ž', 'z');
  
  -- Convert to lowercase and replace spaces and special characters with hyphens
  base_slug := lower(regexp_replace(base_slug, '[^a-zA-Z0-9\s]', '', 'g'));
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

-- Regenerate all slugs to use the new function
UPDATE content_items
SET slug = generate_slug(title); 