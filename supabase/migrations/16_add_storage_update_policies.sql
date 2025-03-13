-- Add UPDATE policies for storage objects
-- This allows authenticated users to update files in the storage buckets

-- Allow authenticated users to update audio files
CREATE POLICY "Allow authenticated users to update audio files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'audio-content' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update documents
CREATE POLICY "Allow authenticated users to update documents"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update thumbnails
CREATE POLICY "Allow authenticated users to update thumbnails"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'thumbnails' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update game assets
CREATE POLICY "Allow authenticated users to update game assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'game-assets' 
        AND auth.role() = 'authenticated'
    ); 