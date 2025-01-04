import type { Database } from './database'

export type ContentType = 'video' | 'audio' | 'lesson_plan' | 'game'

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
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
} 