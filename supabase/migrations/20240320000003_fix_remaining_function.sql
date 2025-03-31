-- Drop the function that still has a search path issue
DROP FUNCTION IF EXISTS public.get_content_feedback_count(uuid);
DROP FUNCTION IF EXISTS public.get_content_feedback_count(content_id uuid);

-- First drop any triggers or dependencies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'content_feedback_count_trigger') THEN
    DROP TRIGGER IF EXISTS content_feedback_count_trigger ON content_feedback;
  END IF;
END $$;

-- Recreate with proper search path
CREATE OR REPLACE FUNCTION public.get_content_feedback_count(content_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT COUNT(*) FROM content_feedback WHERE content_feedback.content_id = $1;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_content_feedback_count(uuid) TO authenticated; 