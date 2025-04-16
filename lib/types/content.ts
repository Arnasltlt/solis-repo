import type { Database } from './database'

export type ContentType = 'video' | 'audio' | 'lesson_plan' | 'game'

export interface Attachment {
  id: string
  fileName: string
  url: string
  fileType: string
  fileSize: number
}

export interface ContentFormData {
  type: ContentType
  title: string
  description?: string
  ageGroups: string[]
  categories: string[]
  thumbnail?: File | null
  contentBody?: string
  accessTierId: string
  published: boolean
  mediaUrl?: string
  metadata?: {
    attachments?: Attachment[]
    [key: string]: any
  }
} 