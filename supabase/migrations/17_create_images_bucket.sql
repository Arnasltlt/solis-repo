-- Create an 'images' bucket for storing editor images
SELECT storage.create_bucket('images'::text, 'images'::text, true);

-- Set up storage policies for public access to read images
CREATE POLICY "Give public access to images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'images');

-- Set up storage policies for authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to update images
CREATE POLICY "Allow authenticated users to update images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete images
CREATE POLICY "Allow authenticated users to delete images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
    );