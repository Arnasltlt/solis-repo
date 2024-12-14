-- First, enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give public access to audio files" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to game assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload game assets" ON storage.objects;

-- Set up storage policies for public access to read files
CREATE POLICY "Give public access to audio files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-content');

CREATE POLICY "Give public access to documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'documents');

CREATE POLICY "Give public access to thumbnails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'thumbnails');

CREATE POLICY "Give public access to game assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'game-assets');

-- Set up storage policies for authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload audio files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'audio-content' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to upload documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to upload thumbnails"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'thumbnails' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to upload game assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'game-assets' 
        AND auth.role() = 'authenticated'
    );

-- Grant usage on storage schema
GRANT usage ON schema storage TO postgres, anon, authenticated, service_role;

-- Grant all on storage.objects to authenticated users
GRANT ALL ON storage.objects TO authenticated;

-- Grant select on storage.objects to anon users
GRANT SELECT ON storage.objects TO anon;
  