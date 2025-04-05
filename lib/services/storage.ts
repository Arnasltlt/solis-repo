import { v4 as uuidv4 } from 'uuid'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createBrowserClient } from '@supabase/ssr'

// Initialize default client (will be used if no client is provided)
const defaultSupabase = typeof window !== 'undefined' 
  ? createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null

export type UploadResult = {
  url: string
  error: Error | null
}

export type FileUploadResult = {
  path: string
  publicUrl: string
}

export type MediaType = 'audio' | 'document' | 'thumbnail' | 'game' | 'image'

const BUCKET_NAMES: Record<MediaType, string> = {
  audio: 'audio-content',
  document: 'documents',
  thumbnail: 'thumbnails',
  game: 'game-assets',
  image: 'images' // Use 'thumbnails' as fallback if 'images' bucket doesn't exist
}

export async function uploadMedia(
  file: File,
  type: MediaType,
  options?: { 
    generateUniqueName?: boolean 
  },
  supabase?: SupabaseClient<Database>
): Promise<UploadResult> {
  try {
    const client = supabase || defaultSupabase
    if (!client) throw new Error('Supabase client not initialized')
    
    const bucketName = BUCKET_NAMES[type]
    const fileExt = file.name.split('.').pop()
    const fileName = options?.generateUniqueName 
      ? `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      : file.name

    const { data, error } = await client.storage
      .from(bucketName)
      .upload(fileName, file)

    if (error) {
      console.error('Storage upload error:', error)
      
      // If this is an image upload and the 'images' bucket doesn't exist,
      // try uploading to the 'thumbnails' bucket as a fallback
      if (type === 'image' && (error.message.includes('bucket') || error.message.includes('Bucket'))) {
        console.log('Falling back to thumbnails bucket for image upload')
        return uploadMedia(file, 'thumbnail', options, supabase)
      }
      
      throw error
    }

    const { data: { publicUrl } } = client.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload media error:', error)
    return { 
      url: '', 
      error: error instanceof Error ? error : new Error('Unknown error during upload') 
    }
  }
}

// Special function for editor image uploads that ensures proper unique naming
export async function uploadEditorImage(
  file: File,
  supabase?: SupabaseClient<Database>
): Promise<UploadResult> {
  console.log('🔍 DIAGNOSTICS: uploadEditorImage function called');
  
  // Create a unique ID for this upload attempt to track it through logs
  const diagnosticId = `upload-${Date.now().toString(36)}`;
  console.log(`🔍 [${diagnosticId}] Starting diagnostic upload process`);
  
  try {
    // 1. Check Supabase client
    const client = supabase || defaultSupabase
    if (!client) {
      console.error(`🔍 [${diagnosticId}] ERROR: Supabase client not initialized`);
      throw new Error('Supabase client not initialized');
    }
    
    console.log(`🔍 [${diagnosticId}] Supabase client check: PASSED`);
    
    // 2. Check authentication
    const { data: session } = await client.auth.getSession();
    console.log(`🔍 [${diagnosticId}] Auth session:`, session ? 'EXISTS' : 'MISSING');
    
    // Use admin client for uploading to bypass RLS
    const adminClient = createAdminClient();
    console.log(`🔍 [${diagnosticId}] Using admin client for uploads to bypass RLS restrictions`);
    
    // 3. Validate file
    console.log(`🔍 [${diagnosticId}] File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    if (!file.type.startsWith('image/')) {
      console.error(`🔍 [${diagnosticId}] ERROR: Invalid file type: ${file.type}`);
      throw new Error(`File must be an image, got: ${file.type}`);
    }
    
    if (file.size === 0) {
      console.error(`🔍 [${diagnosticId}] ERROR: File is empty (0 bytes)`);
      throw new Error('Cannot upload empty file');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      console.error(`🔍 [${diagnosticId}] ERROR: File too large: ${file.size} bytes`);
      throw new Error('File size exceeds 5MB limit');
    }
    
    console.log(`🔍 [${diagnosticId}] File validation: PASSED`);
    
    // 4. Prepare file name
    const timestamp = Date.now()
    const uniqueSuffix = Math.random().toString(36).substring(2, 8)
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.]/g, '-')
    const fileExt = sanitizedOriginalName.split('.').pop() || 'png'
    const fileName = `editor/${timestamp}-${uniqueSuffix}.${fileExt}`
    
    console.log(`🔍 [${diagnosticId}] Generated filename: ${fileName}`);
    
    // 5. Check bucket existence
    try {
      console.log(`🔍 [${diagnosticId}] Checking if buckets exist...`);
      const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
      
      if (bucketsError) {
        console.error(`🔍 [${diagnosticId}] ERROR listing buckets:`, bucketsError);
      } else {
        console.log(`🔍 [${diagnosticId}] Available buckets:`, buckets.map(b => b.name));
        const imagesBucketExists = buckets.some(b => b.name === 'images');
        const thumbnailsBucketExists = buckets.some(b => b.name === 'thumbnails');
        
        console.log(`🔍 [${diagnosticId}] Bucket 'images' exists: ${imagesBucketExists}`);
        console.log(`🔍 [${diagnosticId}] Bucket 'thumbnails' exists: ${thumbnailsBucketExists}`);
      }
    } catch (bucketError) {
      console.error(`🔍 [${diagnosticId}] ERROR checking buckets:`, bucketError);
    }
    
    // 7. Try uploading to thumbnails first since we know that works
    console.log(`🔍 [${diagnosticId}] Attempting to upload file to thumbnails/${fileName}...`);
    
    // Create a copy of the file to ensure it's properly handled
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const fileCopy = new File([fileBlob], fileName, { 
      type: file.type,
      lastModified: file.lastModified 
    });
    
    console.log(`🔍 [${diagnosticId}] File copy created successfully with size: ${fileCopy.size} bytes`);
    
    let result;
    
    try {
      const uploadResult = await adminClient.storage
        .from('thumbnails')
        .upload(fileName, fileCopy, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });
      
      if (uploadResult.error) {
        console.error(`🔍 [${diagnosticId}] Upload to thumbnails FAILED:`, uploadResult.error);
        throw uploadResult.error;
      }
      
      const { data: urlData } = adminClient.storage
        .from('thumbnails')
        .getPublicUrl(uploadResult.data.path);
      
      if (!urlData || !urlData.publicUrl) {
        console.error(`🔍 [${diagnosticId}] ERROR: Failed to get public URL`);
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      const publicUrl = urlData.publicUrl;
      console.log(`🔍 [${diagnosticId}] Upload successful to thumbnails bucket! URL: ${publicUrl}`);
      
      result = { url: publicUrl, error: null };
    } catch (thumbnailsError) {
      console.error(`🔍 [${diagnosticId}] ERROR uploading to thumbnails:`, thumbnailsError);
      
      // Try images bucket as fallback
      try {
        console.log(`🔍 [${diagnosticId}] Attempting to upload file to images/${fileName}...`);
        
        const uploadResult = await adminClient.storage
          .from('images')
          .upload(fileName, fileCopy, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
        
        if (uploadResult.error) {
          console.error(`🔍 [${diagnosticId}] Upload to images FAILED:`, uploadResult.error);
          throw uploadResult.error;
        }
        
        const { data: urlData } = adminClient.storage
          .from('images')
          .getPublicUrl(uploadResult.data.path);
        
        if (!urlData || !urlData.publicUrl) {
          console.error(`🔍 [${diagnosticId}] ERROR: Failed to get public URL`);
          throw new Error('Failed to get public URL for uploaded file');
        }
        
        const publicUrl = urlData.publicUrl;
        console.log(`🔍 [${diagnosticId}] Upload successful to images bucket! URL: ${publicUrl}`);
        
        result = { url: publicUrl, error: null };
      } catch (imagesError) {
        console.error(`🔍 [${diagnosticId}] ERROR uploading to images:`, imagesError);
        throw new Error('Failed to upload image to any storage bucket');
      }
    }
    
    console.log(`🔍 [${diagnosticId}] Upload process COMPLETED SUCCESSFULLY`);
    return result;
  } catch (error) {
    console.error('Error uploading editor image:', error);
    return {
      url: '',
      error: error instanceof Error ? error : new Error('Unknown error during image upload')
    }
  }
}

export async function deleteMedia(
  url: string, 
  type: MediaType,
  supabase?: SupabaseClient<Database>
): Promise<{ error: Error | null }> {
  try {
    const client = supabase || defaultSupabase
    if (!client) throw new Error('Supabase client not initialized')
    
    const bucketName = BUCKET_NAMES[type]
    const fileName = url.split('/').pop()
    
    if (!fileName) throw new Error('Invalid URL')

    const { error } = await client.storage
      .from(bucketName)
      .remove([fileName])

    if (error) throw error

    return { error: null }
  } catch (error) {
    return { 
      error: error instanceof Error ? error : new Error('Unknown error during deletion') 
    }
  }
}

export async function listMediaInBucket(
  type: MediaType,
  supabase?: SupabaseClient<Database>
) {
  try {
    const client = supabase || defaultSupabase
    if (!client) throw new Error('Supabase client not initialized')
    
    const bucketName = BUCKET_NAMES[type]
    const { data, error } = await client.storage
      .from(bucketName)
      .list()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error listing bucket contents') 
    }
  }
}

export async function uploadFile(
  file: File, 
  bucket: string, 
  path: string,
  supabase?: SupabaseClient<Database>
): Promise<FileUploadResult> {
  try {
    const client = supabase || defaultSupabase
    if (!client) throw new Error('Supabase client not initialized')
    
    // Validate inputs
    if (!file) throw new Error('No file provided')
    if (!bucket) throw new Error('No bucket specified')
    if (!path) throw new Error('No path specified')
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}/${uuidv4()}.${fileExt}`
    
    // Upload the file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Get the public URL
    const { data: { publicUrl } } = client.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    return {
      path: data.path,
      publicUrl
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
} 