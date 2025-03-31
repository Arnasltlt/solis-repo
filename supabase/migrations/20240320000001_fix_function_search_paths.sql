-- First remove dependencies
ALTER TABLE content_items ALTER COLUMN access_tier_id DROP DEFAULT;
DROP TRIGGER IF EXISTS content_slug_trigger ON content_items;
DROP TRIGGER IF EXISTS validate_content_metadata_trigger ON content_items;
DROP TRIGGER IF EXISTS ensure_content_metadata ON content_items;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_content_feedback_count(uuid);
DROP FUNCTION IF EXISTS public.get_default_access_tier();
DROP FUNCTION IF EXISTS public.set_content_slug();
DROP FUNCTION IF EXISTS public.validate_content_metadata();
DROP FUNCTION IF EXISTS public.generate_slug(text);

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.get_content_feedback_count(content_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT COUNT(*) FROM content_feedback WHERE content_feedback.content_id = $1;
$$;

CREATE OR REPLACE FUNCTION public.get_default_access_tier()
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    -- Get the free tier as the default tier
    SELECT id FROM access_tiers 
    WHERE name = 'free' 
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_content_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_content_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Ensure content has at least one age group
    IF NOT EXISTS (
        SELECT 1 FROM content_age_groups
        WHERE content_id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Content must have at least one age group';
    END IF;

    -- Ensure content has at least one category
    IF NOT EXISTS (
        SELECT 1 FROM content_categories
        WHERE content_id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Content must have at least one category';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
BEGIN
    -- Convert to lowercase and replace spaces and special chars with hyphens
    base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    
    -- Initial attempt with just the base slug
    final_slug := base_slug;
    
    -- Keep trying with incremented counter until we find a unique slug
    WHILE EXISTS (SELECT 1 FROM content_items WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_content_feedback_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_default_access_tier() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_slug(text) TO authenticated;

-- Restore dependencies
ALTER TABLE content_items ALTER COLUMN access_tier_id SET DEFAULT get_default_access_tier();

-- Recreate triggers
CREATE TRIGGER content_slug_trigger
    BEFORE INSERT OR UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION set_content_slug();

CREATE TRIGGER ensure_content_metadata
    AFTER INSERT OR UPDATE ON content_items
    FOR EACH ROW
    EXECUTE FUNCTION validate_content_metadata(); 