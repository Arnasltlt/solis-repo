import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Utility functions for handling file storage operations
 */

// Storage bucket names
const AUDIO_BUCKET = 'audio-content'
const DOCUMENTS_BUCKET = 'documents'
const THUMBNAILS_BUCKET = 'thumbnails'
const GAME_ASSETS_BUCKET = 'game-assets'
const CONTENT_IMAGES_BUCKET = 'content-images'

export type UploadResult = {
  url: string
  error: Error | null
}

export type FileUploadResult = {
  path: string
  publicUrl: string
}

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path Optional path within the bucket
 * @returns Object with file path and public URL
 */
export async function uploadFile(
  supabase: SupabaseClient<Database>,
  file: File, 
  bucket: string, 
  path?: string
): Promise<FileUploadResult> {
  try {
    if (!file) throw new Error('No file provided')
    if (!supabase) throw new Error('Supabase client not initialized')
    
    // Generate a unique filename
    const timestamp = new Date().getTime()
    const fileExt = file.name.split('.').pop()
    const fileName = path 
      ? `${path}/${timestamp}-${file.name}`
      : `${timestamp}-${file.name}`
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    return {
      path: data.path,
      publicUrl
    }
  } catch (error) {
    throw error
  }
}

/**
 * Deletes a file from Supabase storage
 * @param path The file path to delete
 * @param bucket The storage bucket name
 * @returns Success status
 */
export async function deleteFile(
  supabase: SupabaseClient<Database>,
  path: string, 
  bucket: string
) {
  try {
    if (!path) throw new Error('No file path provided')
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during deletion'
    }
  }
}

/**
 * Lists files in a Supabase storage bucket
 * @param bucket The storage bucket name
 * @param path Optional path within the bucket
 * @returns Array of file objects
 */
export async function listFiles(
  supabase: SupabaseClient<Database>,
  bucket: string, 
  path?: string
) {
  try {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path)
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error listing files'
    }
  }
}

/**
 * Upload audio file to Supabase Storage
 * @param file The audio file to upload
 * @returns Object with public URL and error (if any)
 */
export async function uploadAudio(
  supabase: SupabaseClient<Database>,
  file: File
): Promise<UploadResult> {
  try {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Audio upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload audio error:', error)
    return { 
      url: '', 
      error: error instanceof Error ? error : new Error('Unknown error during upload') 
    }
  }
}

/**
 * Upload document (lesson plan) to Supabase Storage
 * @param file The document file to upload
 * @returns Object with public URL and error (if any)
 */
export async function uploadDocument(
  supabase: SupabaseClient<Database>,
  file: File
): Promise<UploadResult> {
  try {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Document upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload document error:', error)
    return { 
      url: '', 
      error: error instanceof Error ? error : new Error('Unknown error during upload') 
    }
  }
}

/**
 * Upload thumbnail image to Supabase Storage with comprehensive diagnostics
 * @param file The image file to upload
 * @returns Object with public URL and error (if any)
 */
export async function uploadThumbnail(
  supabase: SupabaseClient<Database>,
  file: File
): Promise<UploadResult> {
  console.log('🔍 DIAGNOSTICS: uploadThumbnail function called');
  
  // Create a unique ID for this upload attempt to track it through logs
  const diagnosticId = `upload-${Date.now().toString(36)}`;
  console.log(`🔍 [${diagnosticId}] Starting diagnostic upload process`);
  
  try {
    // 1. Check Supabase client
    if (!supabase) {
      console.error(`🔍 [${diagnosticId}] ERROR: Supabase client not initialized`);
      throw new Error('Supabase client not initialized');
    }
    
    console.log(`🔍 [${diagnosticId}] Supabase client check: PASSED`);
    
    // 2. Check authentication
    const { data: session } = await supabase.auth.getSession();
    console.log(`🔍 [${diagnosticId}] Auth session:`, session ? 'EXISTS' : 'MISSING');
    
    if (!session?.session?.user) {
      console.error(`🔍 [${diagnosticId}] ERROR: User not authenticated for upload`);
      throw new Error('Authentication required for upload');
    }
    
    console.log(`🔍 [${diagnosticId}] Authentication check: PASSED (User ID: ${session.session.user.id.substring(0, 8)}...)`);
    
    // 3. Validate file
    console.log(`🔍 [${diagnosticId}] File details:`, {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    if (!file.type.startsWith('image/')) {
      console.error(`🔍 [${diagnosticId}] ERROR: Invalid file type: ${file.type}`);
      throw new Error(`Thumbnail must be an image file, got: ${file.type}`);
    }
    
    if (file.size === 0) {
      console.error(`🔍 [${diagnosticId}] ERROR: File is empty (0 bytes)`);
      throw new Error('Cannot upload empty file');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      console.error(`🔍 [${diagnosticId}] ERROR: File too large: ${file.size} bytes`);
      throw new Error('File size exceeds 10MB limit');
    }
    
    console.log(`🔍 [${diagnosticId}] File validation: PASSED`);
    
    // 4. Prepare file name
    const fileNameParts = file.name.split('.');
    const fileExt = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
    const uniqueId = `${diagnosticId}-${Math.random().toString(36).substring(2, 10)}`;
    const fileName = `${uniqueId}.${fileExt}`;
    
    console.log(`🔍 [${diagnosticId}] Generated filename: ${fileName}`);
    
    // 5. Check bucket existence
    try {
      console.log(`🔍 [${diagnosticId}] Checking if bucket '${THUMBNAILS_BUCKET}' exists...`);
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error(`🔍 [${diagnosticId}] ERROR listing buckets:`, bucketsError);
      } else {
        const bucketExists = buckets.some(b => b.name === THUMBNAILS_BUCKET);
        console.log(`🔍 [${diagnosticId}] Bucket '${THUMBNAILS_BUCKET}' exists: ${bucketExists}`);
        
        if (!bucketExists) {
          console.error(`🔍 [${diagnosticId}] ERROR: Target bucket '${THUMBNAILS_BUCKET}' does not exist`);
        }
      }
    } catch (bucketError) {
      console.error(`🔍 [${diagnosticId}] ERROR checking buckets:`, bucketError);
    }
    
    // 6. Check bucket permissions
    try {
      console.log(`🔍 [${diagnosticId}] Testing bucket permissions with a small test file...`);
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'permission-test.txt', { type: 'text/plain' });
      
      const { data: testData, error: testError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .upload(`${diagnosticId}-test.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (testError) {
        console.error(`🔍 [${diagnosticId}] Permission test FAILED:`, testError);
      } else {
        console.log(`🔍 [${diagnosticId}] Permission test PASSED, test file uploaded successfully`);
        
        // Clean up test file
        try {
          await supabase.storage
            .from(THUMBNAILS_BUCKET)
            .remove([`${diagnosticId}-test.txt`]);
          console.log(`🔍 [${diagnosticId}] Test file removed successfully`);
        } catch (cleanupError) {
          console.warn(`🔍 [${diagnosticId}] Failed to remove test file:`, cleanupError);
        }
      }
    } catch (permissionError) {
      console.error(`🔍 [${diagnosticId}] ERROR testing permissions:`, permissionError);
    }
    
    // 7. Attempt upload with detailed diagnostics
    console.log(`🔍 [${diagnosticId}] Attempting to upload file to ${THUMBNAILS_BUCKET}/${fileName}...`);
    
    // Create a copy of the file to ensure it's properly handled
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const fileCopy = new File([fileBlob], fileName, { 
      type: file.type,
      lastModified: file.lastModified 
    });
    
    console.log(`🔍 [${diagnosticId}] File prepared for upload:`, {
      name: fileCopy.name,
      size: fileCopy.size,
      type: fileCopy.type
    });
    
    // First try with upsert: true
    console.log(`🔍 [${diagnosticId}] Upload attempt #1 (with upsert: true)`);
    let uploadResult = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(fileName, fileCopy, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    
    if (uploadResult.error) {
      console.error(`🔍 [${diagnosticId}] Upload attempt #1 FAILED:`, uploadResult.error);
      
      // Try again with upsert: false and a different filename
      const fallbackFileName = `${uniqueId}-fallback.${fileExt}`;
      console.log(`🔍 [${diagnosticId}] Upload attempt #2 (with upsert: false, filename: ${fallbackFileName})`);
      
      uploadResult = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .upload(fallbackFileName, fileCopy, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      
      if (uploadResult.error) {
        console.error(`🔍 [${diagnosticId}] Upload attempt #2 FAILED:`, uploadResult.error);
        
        // Try one more time with minimal options
        const lastResortFileName = `${uniqueId}-last-resort.${fileExt}`;
        console.log(`🔍 [${diagnosticId}] Upload attempt #3 (minimal options, filename: ${lastResortFileName})`);
        
        uploadResult = await supabase.storage
          .from(THUMBNAILS_BUCKET)
          .upload(lastResortFileName, fileCopy);
        
        if (uploadResult.error) {
          console.error(`🔍 [${diagnosticId}] Upload attempt #3 FAILED:`, uploadResult.error);
          throw new Error(`All upload attempts failed: ${uploadResult.error.message}`);
        } else {
          console.log(`🔍 [${diagnosticId}] Upload attempt #3 SUCCEEDED`);
        }
      } else {
        console.log(`🔍 [${diagnosticId}] Upload attempt #2 SUCCEEDED`);
      }
    } else {
      console.log(`🔍 [${diagnosticId}] Upload attempt #1 SUCCEEDED`);
    }
    
    if (!uploadResult.data || !uploadResult.data.path) {
      console.error(`🔍 [${diagnosticId}] ERROR: Upload succeeded but no path returned`);
      throw new Error('No file path returned from upload');
    }
    
    console.log(`🔍 [${diagnosticId}] Upload successful, file path: ${uploadResult.data.path}`);
    
    // 8. Get public URL
    console.log(`🔍 [${diagnosticId}] Getting public URL for path: ${uploadResult.data.path}`);
    
    const { data: urlData } = supabase.storage
      .from(THUMBNAILS_BUCKET)
      .getPublicUrl(uploadResult.data.path);
    
    if (!urlData || !urlData.publicUrl) {
      console.error(`🔍 [${diagnosticId}] ERROR: Failed to get public URL`);
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    const publicUrl = urlData.publicUrl;
    console.log(`🔍 [${diagnosticId}] Public URL obtained: ${publicUrl}`);
    
    // 9. Validate URL
    try {
      const testUrl = new URL(publicUrl);
      console.log(`🔍 [${diagnosticId}] URL validation: PASSED (${testUrl.toString()})`);
    } catch (urlError) {
      console.error(`🔍 [${diagnosticId}] ERROR: Invalid URL format: ${publicUrl}`, urlError);
      throw new Error('Invalid URL format returned from Supabase');
    }
    
    // 10. Test URL accessibility
    try {
      console.log(`🔍 [${diagnosticId}] Testing URL accessibility...`);
      const testResponse = await fetch(publicUrl, { method: 'HEAD', mode: 'no-cors' });
      console.log(`🔍 [${diagnosticId}] URL accessibility test:`, testResponse.ok ? 'PASSED' : 'FAILED');
    } catch (fetchError) {
      console.warn(`🔍 [${diagnosticId}] URL accessibility test error:`, fetchError);
      // Don't throw here, as CORS might prevent this check from working
    }
    
    console.log(`🔍 [${diagnosticId}] Upload process COMPLETED SUCCESSFULLY`);
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error(`🔍 [${diagnosticId}] FATAL ERROR in upload process:`, error);
    return { 
      url: 'https://placehold.co/600x400/png?text=Upload+Failed', 
      error: error instanceof Error ? error : new Error('Unknown error during upload') 
    };
  }
}

/**
 * Upload game assets as a zip file to Supabase Storage
 * @param file The zip file containing game assets
 * @returns Object with public URL and error (if any)
 */
export async function uploadGameAssets(
  supabase: SupabaseClient<Database>,
  file: File
): Promise<UploadResult> {
  try {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    // Validate file type
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      throw new Error('Game assets must be uploaded as a ZIP file')
    }
    
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.zip`
    const { data, error } = await supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Game assets upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload game assets error:', error)
    return { 
      url: '', 
      error: error instanceof Error ? error : new Error('Unknown error during upload') 
    }
  }
}

/**
 * Upload an image for content to Supabase Storage
 * @param file The image file to upload
 * @param supabase The Supabase client
 * @param path Optional path within the bucket
 * @returns Object with file path and public URL
 */
export async function uploadImage(
  file: File,
  supabase: SupabaseClient<Database>,
  path?: string
): Promise<{ path: string; url: string }> {
  try {
    console.log('Uploading image to content-images bucket:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      path
    })
    
    // Upload the file using the generic uploadFile function
    const result = await uploadFile(supabase, file, CONTENT_IMAGES_BUCKET, path)
    
    console.log('Image uploaded successfully:', {
      path: result.path,
      url: result.publicUrl
    })
    
    return {
      path: result.path,
      url: result.publicUrl
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
} 