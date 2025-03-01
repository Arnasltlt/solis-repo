import { supabase } from '@/lib/supabase/client'

/**
 * Utility functions for handling file storage operations
 */

// Storage bucket names
const AUDIO_BUCKET = 'audio-content'
const DOCUMENTS_BUCKET = 'documents'
const THUMBNAILS_BUCKET = 'thumbnails'
const GAME_ASSETS_BUCKET = 'game-assets'

export type UploadResult = {
  url: string
  error: Error | null
}

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path Optional path within the bucket
 * @returns Object with file path and public URL
 */
export async function uploadFile(file: File, bucket: string, path?: string) {
  try {
    if (!file) throw new Error('No file provided')
    
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
export async function deleteFile(path: string, bucket: string) {
  try {
    if (!path) throw new Error('No file path provided')
    
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
export async function listFiles(bucket: string, path?: string) {
  try {
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
export async function uploadAudio(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error instanceof Error ? error : new Error('Unknown error') }
  }
}

/**
 * Upload document (lesson plan) to Supabase Storage
 * @param file The document file to upload
 * @returns Object with public URL and error (if any)
 */
export async function uploadDocument(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error instanceof Error ? error : new Error('Unknown error') }
  }
}

/**
 * Upload thumbnail image to Supabase Storage
 * @param file The image file to upload
 * @returns Object with public URL and error (if any)
 */
export async function uploadThumbnail(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(THUMBNAILS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error instanceof Error ? error : new Error('Unknown error') }
  }
}

/**
 * Upload game assets as a zip file to Supabase Storage
 * @param file The zip file containing game assets
 * @returns Object with public URL and error (if any)
 */
export async function uploadGameAssets(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error instanceof Error ? error : new Error('Unknown error') }
  }
} 