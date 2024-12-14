import { supabase } from '@/lib/supabase/client'

export type UploadResult = {
  url: string
  error: Error | null
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

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
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