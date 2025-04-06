import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import fs from 'fs'
import path from 'path'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('API FIX STORAGE: Starting storage policy fix');
  
  try {
    // Get admin client
    const adminClient = createAdminClient();
    
    // Run SQL migration directly (manually inline the SQL here instead of reading the file for simplicity)
    const sql = `
      -- First, check if the buckets exist and create them if not
      DO $$
      BEGIN
        -- Check and create thumbnails bucket
        IF NOT EXISTS (
          SELECT 1 FROM storage.buckets WHERE name = 'thumbnails'
        ) THEN
          PERFORM storage.create_bucket('thumbnails'::text, 'thumbnails'::text, true);
        END IF;

        -- Check and create images bucket
        IF NOT EXISTS (
          SELECT 1 FROM storage.buckets WHERE name = 'images'
        ) THEN
          PERFORM storage.create_bucket('images'::text, 'images'::text, true);
        END IF;
      END
      $$;

      -- Recreate policies for thumbnails bucket
      DROP POLICY IF EXISTS "Give public access to thumbnails" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated users to update thumbnails" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated users to upload thumbnails" ON storage.objects;
      DROP POLICY IF EXISTS "Allow anon access to thumbnails" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public access to thumbnails" ON storage.objects;

      -- Create public SELECT policy for thumbnails
      CREATE POLICY "Allow public access to thumbnails"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'thumbnails');

      -- Create INSERT policy for thumbnails (for authenticated users)
      CREATE POLICY "Allow authenticated users to upload thumbnails"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'thumbnails' 
          AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
        );

      -- Create UPDATE policy for thumbnails
      CREATE POLICY "Allow authenticated users to update thumbnails"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'thumbnails'
          AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
        );

      -- Recreate policies for images bucket
      DROP POLICY IF EXISTS "Give public access to images" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public access to images" ON storage.objects;

      -- Create public SELECT policy for images
      CREATE POLICY "Allow public access to images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'images');

      -- Create INSERT policy for images (for authenticated users)
      CREATE POLICY "Allow authenticated users to upload images"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'images'
          AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
        );

      -- Create UPDATE policy for images
      CREATE POLICY "Allow authenticated users to update images"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'images'
          AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
        );

      -- Grant permissions to anonymous users to read from these buckets
      GRANT SELECT ON storage.objects TO anon;
      GRANT SELECT ON storage.buckets TO anon;

      -- Make both buckets public
      UPDATE storage.buckets 
      SET public = true 
      WHERE name IN ('thumbnails', 'images');
    `;
    
    // Execute the SQL
    console.log('API FIX STORAGE: Executing SQL');
    const { error } = await adminClient.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('API FIX STORAGE: SQL execution error:', error);
      return NextResponse.json({ error: `SQL execution failed: ${error.message}` }, { status: 500 });
    }
    
    console.log('API FIX STORAGE: SQL executed successfully');
    
    // List buckets to verify
    const { data: buckets, error: bucketError } = await adminClient.storage.listBuckets();
    
    if (bucketError) {
      console.error('API FIX STORAGE: Error listing buckets:', bucketError);
    } else {
      console.log('API FIX STORAGE: Available buckets:', buckets);
    }
    
    // Check current policies
    const { data: policies, error: policyError } = await adminClient.rpc('get_policies', { 
      schema_name: 'storage' 
    });
    
    if (policyError) {
      console.error('API FIX STORAGE: Error listing policies:', policyError);
    } else {
      console.log('API FIX STORAGE: Storage policies:', policies);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Storage policies updated successfully',
      buckets: buckets || [],
      policies: policies || []
    });
    
  } catch (error) {
    console.error('API FIX STORAGE: Unexpected error:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 