export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          age_group: string
          category: string
          type: 'video' | 'audio' | 'lesson_plan' | 'game'
          thumbnail_url: string | null
          vimeo_id: string | null
          audio_url: string | null
          document_url: string | null
          game_assets_url: string | null
          metadata: Json
          published: boolean
          author_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          age_group: string
          category: string
          type: 'video' | 'audio' | 'lesson_plan' | 'game'
          thumbnail_url?: string | null
          vimeo_id?: string | null
          audio_url?: string | null
          document_url?: string | null
          game_assets_url?: string | null
          metadata?: Json
          published?: boolean
          author_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          age_group?: string
          category?: string
          type?: 'video' | 'audio' | 'lesson_plan' | 'game'
          thumbnail_url?: string | null
          vimeo_id?: string | null
          audio_url?: string | null
          document_url?: string | null
          game_assets_url?: string | null
          metadata?: Json
          published?: boolean
          author_id?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
        }
      }
      age_groups: {
        Row: {
          id: string
          range: string
          description: string | null
        }
        Insert: {
          id?: string
          range: string
          description?: string | null
        }
        Update: {
          id?: string
          range?: string
          description?: string | null
        }
      }
    }
  }
}

export type ContentItem = Database['public']['Tables']['content_items']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type AgeGroup = Database['public']['Tables']['age_groups']['Row'] 