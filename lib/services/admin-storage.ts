import { v4 as uuidv4 } from 'uuid'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export type UploadResult = {
  url: string
  error: Error | null
}

export type AttachmentUploadResult = {
  url: string
  fileName: string
  fileSize: number
  fileType: string
  error: Error | null
}

/**
 * IMPORTANT: These admin functions should ONLY be used from server-side code like API routes.
 * 
 * From client components, ALWAYS use the API endpoints instead:
 * - POST /api/manage/upload-image (with type='thumbnail' or type='editor')
 * 
 * Direct usage of these functions from client components will fail because
 * the service role key is only available on the server.
 */

/**
 * Upload an image for the content editor using the admin client to bypass RLS
 * This is specifically for administrators to use in the content editor
 */
export async function uploadEditorImageAdmin(file: File): Promise<UploadResult> {
  const logPrefix = '🔍 ADMIN-EDITOR';
  console.log(`${logPrefix}: Upload starting for editor image`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  try {
    // 1. Use the admin client to bypass RLS
    console.log(`${logPrefix}: Creating admin client to bypass RLS`);
    const adminClient = createAdminClient();
    
    // 2. Validate file
    if (!file.type.startsWith('image/')) {
      console.error(`${logPrefix}: Invalid file type: ${file.type}`);
      throw new Error(`File must be an image, got: ${file.type}`);
    }
    
    if (file.size === 0) {
      console.error(`${logPrefix}: File is empty (0 bytes)`);
      throw new Error('Cannot upload empty file');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      console.error(`${logPrefix}: File too large: ${file.size} bytes`);
      throw new Error('File size exceeds 5MB limit');
    }
    
    console.log(`${logPrefix}: File validation passed`);
    
    // 3. Prepare file name
    const timestamp = Date.now()
    const uniqueSuffix = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `editor/${timestamp}-${uniqueSuffix}.${fileExt}`
    
    console.log(`${logPrefix}: Generated filename: ${fileName}`);
    
    // 4. Upload the file to the thumbnails bucket using admin client
    console.log(`${logPrefix}: Attempting upload to thumbnails bucket...`);
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('thumbnails')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error(`${logPrefix}: Upload error:`, uploadError);
      throw uploadError;
    }
    
    console.log(`${logPrefix}: Upload successful, getting public URL...`);
    
    // 5. Get the public URL
    const { data: urlData } = adminClient.storage
      .from('thumbnails')
      .getPublicUrl(uploadData.path);
    
    if (!urlData || !urlData.publicUrl) {
      console.error(`${logPrefix}: Failed to get public URL`);
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log(`${logPrefix}: Upload complete! Public URL:`, urlData.publicUrl);
    
    return { 
      url: urlData.publicUrl, 
      error: null 
    };
  } catch (error) {
    console.error(`${logPrefix}: Error uploading image:`, error);
    return {
      url: '',
      error: error instanceof Error ? error : new Error('Unknown error during image upload')
    }
  }
}

/**
 * Upload a thumbnail image using admin client to bypass RLS
 */
export async function uploadThumbnailAdmin(file: File): Promise<UploadResult> {
  const logPrefix = '🔍 ADMIN-THUMBNAIL';
  console.log(`${logPrefix}: Upload starting for thumbnail`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  try {
    // 1. Use the admin client to bypass RLS
    console.log(`${logPrefix}: Creating admin client to bypass RLS`);
    const adminClient = createAdminClient();
    console.log(`${logPrefix}: Admin client created`);
    
    // 2. Validate file
    if (!file.type.startsWith('image/')) {
      console.error(`${logPrefix}: Invalid file type: ${file.type}`);
      throw new Error(`File must be an image, got: ${file.type}`);
    }
    
    if (file.size === 0) {
      console.error(`${logPrefix}: File is empty (0 bytes)`);
      throw new Error('Cannot upload empty file');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      console.error(`${logPrefix}: File too large: ${file.size} bytes`);
      throw new Error('File size exceeds 10MB limit');
    }
    
    console.log(`${logPrefix}: File validation passed`);
    
    // 3. Prepare file name
    const timestamp = Date.now()
    const uniqueSuffix = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `thumbnail/${timestamp}-${uniqueSuffix}.${fileExt}`
    
    console.log(`${logPrefix}: Generated filename: ${fileName}`);
    
    // 4. Create a blob copy of the file to ensure it's properly handled
    console.log(`${logPrefix}: Creating file blob copy...`);
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const fileCopy = new File([fileBlob], fileName, { 
      type: file.type,
      lastModified: file.lastModified 
    });
    console.log(`${logPrefix}: File copy created with size: ${fileCopy.size} bytes`);
    
    // 5. Upload the file to the thumbnails bucket using admin client
    console.log(`${logPrefix}: Attempting upload to thumbnails bucket...`);
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('thumbnails')
      .upload(fileName, fileCopy, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error(`${logPrefix}: Upload error:`, uploadError);
      throw uploadError;
    }
    
    console.log(`${logPrefix}: Upload successful, getting public URL...`);
    
    // 6. Get the public URL
    const { data: urlData } = adminClient.storage
      .from('thumbnails')
      .getPublicUrl(uploadData.path);
    
    if (!urlData || !urlData.publicUrl) {
      console.error(`${logPrefix}: Failed to get public URL`);
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log(`${logPrefix}: Upload complete! Public URL:`, urlData.publicUrl);
    
    return { 
      url: urlData.publicUrl, 
      error: null 
    };
  } catch (error) {
    console.error(`${logPrefix}: Error uploading thumbnail:`, error);
    return {
      url: '',
      error: error instanceof Error ? error : new Error('Unknown error during image upload')
    }
  }
}

/**
 * Upload an attachment file using admin client to bypass RLS
 * This is specifically for administrators to use in the content editor
 */
export async function uploadAttachmentAdmin(file: File): Promise<AttachmentUploadResult> {
  const logPrefix = '🔍 ADMIN-ATTACHMENT';
  console.log(`${logPrefix}: Upload starting for attachment`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  try {
    // 1. Use the admin client to bypass RLS
    console.log(`${logPrefix}: Creating admin client to bypass RLS`);
    const adminClient = createAdminClient();
    
    // 2. Validate file
    if (file.size === 0) {
      console.error(`${logPrefix}: File is empty (0 bytes)`);
      throw new Error('Cannot upload empty file');
    }
    
    if (file.size > 50 * 1024 * 1024) {
      console.error(`${logPrefix}: File too large: ${file.size} bytes`);
      throw new Error('File size exceeds 50MB limit');
    }
    
    console.log(`${logPrefix}: File validation passed`);
    
    // 3. Prepare file name
    const timestamp = Date.now()
    const uniqueSuffix = Math.random().toString(36).substring(2, 8)
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_') // Sanitize filename
    const fileExt = originalName.split('.').pop() || 'bin'
    const fileName = `attachments/${timestamp}-${uniqueSuffix}-${originalName}`
    
    console.log(`${logPrefix}: Generated filename: ${fileName}`);
    
    // 4. Create a blob copy of the file to ensure it's properly handled
    console.log(`${logPrefix}: Creating file blob copy...`);
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const fileCopy = new File([fileBlob], fileName, { 
      type: file.type,
      lastModified: file.lastModified 
    });
    console.log(`${logPrefix}: File copy created with size: ${fileCopy.size} bytes`);
    
    // 5. Upload the file to the documents bucket using admin client
    console.log(`${logPrefix}: Attempting upload to documents bucket...`);
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('documents')
      .upload(fileName, fileCopy, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error(`${logPrefix}: Upload error:`, uploadError);
      throw uploadError;
    }
    
    console.log(`${logPrefix}: Upload successful, getting public URL...`);
    
    // 6. Get the public URL
    const { data: urlData } = adminClient.storage
      .from('documents')
      .getPublicUrl(uploadData.path);
    
    if (!urlData || !urlData.publicUrl) {
      console.error(`${logPrefix}: Failed to get public URL`);
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    console.log(`${logPrefix}: Upload complete! Public URL:`, urlData.publicUrl);
    
    return { 
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      error: null 
    };
  } catch (error) {
    console.error(`${logPrefix}: Error uploading attachment:`, error);
    return {
      url: '',
      fileName: '',
      fileSize: 0,
      fileType: '',
      error: error instanceof Error ? error : new Error('Unknown error during attachment upload')
    }
  }
} 