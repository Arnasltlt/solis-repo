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
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string
        }
      }
      age_groups: {
        Row: {
          id: string
          range: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          range: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          range?: string
          description?: string | null
          created_at?: string
        }
      }
      content_age_groups: {
        Row: {
          content_id: string
          age_group_id: string
          created_at: string
        }
        Insert: {
          content_id: string
          age_group_id: string
          created_at?: string
        }
        Update: {
          content_id?: string
          age_group_id?: string
          created_at?: string
        }
      }
      content_categories: {
        Row: {
          content_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          content_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          content_id?: string
          category_id?: string
          created_at?: string
        }
      }
    }
  }
}

// Derived types
export type AgeGroup = Database['public']['Tables']['age_groups']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type ContentAgeGroup = Database['public']['Tables']['content_age_groups']['Row']
export type ContentCategory = Database['public']['Tables']['content_categories']['Row']

// Extended ContentItem type with relationships
export type ContentItem = Database['public']['Tables']['content_items']['Row'] & {
  age_groups: AgeGroup[]
  categories: Category[]
  content_age_groups?: ContentAgeGroup[]
  content_categories?: ContentCategory[]
} 