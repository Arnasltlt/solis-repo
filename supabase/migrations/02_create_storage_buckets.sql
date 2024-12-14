-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "storage";

-- Drop existing buckets if they exist
DO $$
BEGIN
    PERFORM storage.delete_bucket('audio-content');
    PERFORM storage.delete_bucket('documents');
    PERFORM storage.delete_bucket('thumbnails');
    PERFORM storage.delete_bucket('game-assets');
EXCEPTION WHEN OTHERS THEN
    -- Do nothing, buckets didn't exist
END $$;

-- Create storage buckets using the storage API
SELECT storage.create_bucket('audio-content'::text, 'audio-content'::text, true);
SELECT storage.create_bucket('documents'::text, 'documents'::text, true);
SELECT storage.create_bucket('thumbnails'::text, 'thumbnails'::text, true);
SELECT storage.create_bucket('game-assets'::text, 'game-assets'::text, true);

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