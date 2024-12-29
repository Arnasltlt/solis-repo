export interface AgeGroup {
  id: string
  range: string
  description: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  created_at: string
}

export interface AccessTier {
  id: string
  name: string
  level: number
  features: {
    description: string
  }
  created_at: string
}

export interface ContentItem {
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
  metadata: Record<string, any>
  published: boolean
  author_id: string
  access_tier_id: string
  access_tier?: AccessTier
  age_groups: AgeGroup[]
  categories: Category[]
  content_body?: string
}

export interface Database {
  public: {
    Tables: {
      age_groups: {
        Row: AgeGroup
        Insert: Omit<AgeGroup, 'id' | 'created_at'>
        Update: Partial<Omit<AgeGroup, 'id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      access_tiers: {
        Row: AccessTier
        Insert: Omit<AccessTier, 'id' | 'created_at'>
        Update: Partial<Omit<AccessTier, 'id' | 'created_at'>>
      }
      content_items: {
        Row: ContentItem
        Insert: Omit<ContentItem, 'id' | 'created_at' | 'age_groups' | 'categories' | 'access_tier'>
        Update: Partial<Omit<ContentItem, 'id' | 'created_at' | 'age_groups' | 'categories' | 'access_tier'>>
      }
    }
    Views: {
      users: {
        Row: {
          id: string
          email: string
          subscription_tier_id: string | null
        }
      }
    }
  }
} 