import { supabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export type UploadResult = {
  url: string
  error: Error | null
}

export type FileUploadResult = {
  path: string
  publicUrl: string
}

export type MediaType = 'audio' | 'document' | 'thumbnail' | 'game'

const BUCKET_NAMES: Record<MediaType, string> = {
  audio: 'audio-content',
  document: 'documents',
  thumbnail: 'thumbnails',
  game: 'game-assets'
}

export async function uploadMedia(
  file: File,
  type: MediaType,
  options?: { 
    generateUniqueName?: boolean 
  }
): Promise<UploadResult> {
  try {
    const bucketName = BUCKET_NAMES[type]
    const fileExt = file.name.split('.').pop()
    const fileName = options?.generateUniqueName 
      ? `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      : file.name

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file)

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
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

export async function deleteMedia(url: string, type: MediaType): Promise<{ error: Error | null }> {
  try {
    const bucketName = BUCKET_NAMES[type]
    const fileName = url.split('/').pop()
    
    if (!fileName) throw new Error('Invalid URL')

    const { error } = await supabase.storage
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

export async function listMediaInBucket(type: MediaType) {
  try {
    const bucketName = BUCKET_NAMES[type]
    const { data, error } = await supabase.storage
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

export async function uploadFile(file: File, bucket: string, path: string): Promise<FileUploadResult> {
  try {
    // Validate inputs
    if (!file) throw new Error('No file provided')
    if (!bucket) throw new Error('No bucket specified')
    if (!path) throw new Error('No path specified')
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}/${uuidv4()}.${fileExt}`
    
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
    console.error('Error uploading file:', error)
    throw error
  }
} 