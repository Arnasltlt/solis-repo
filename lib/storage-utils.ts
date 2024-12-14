import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

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
 * Upload audio file to Supabase Storage
 */
export async function uploadAudio(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error as Error }
  }
}

/**
 * Upload document (lesson plan) to Supabase Storage
 */
export async function uploadDocument(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error as Error }
  }
}

/**
 * Upload thumbnail image to Supabase Storage
 */
export async function uploadThumbnail(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(THUMBNAILS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error as Error }
  }
}

/**
 * Upload game assets as a zip file to Supabase Storage
 */
export async function uploadGameAssets(file: File): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const { data, error } = await supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: '', error: error as Error }
  }
}

// Note: Vimeo upload will require a separate implementation using their API
// You'll need to add @vimeo/vimeo package and implement video upload logic
// Example implementation will be added once you set up Vimeo API credentials 