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
  slug: string
  type: 'video' | 'audio' | 'lesson_plan' | 'game'
  thumbnail_url: string | null
  audio_url: string | null
  metadata: Record<string, any>
  published: boolean
  author_id: string
  access_tier_id: string
  access_tier?: AccessTier
  age_groups: AgeGroup[]
  categories: Category[]
  content_body?: string
  content_body_html?: string
  feedback_count?: number
}

export interface ContentFeedback {
  id: string
  content_id: string
  user_id: string
  used_in_class: boolean
  created_at: string
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
        Insert: Omit<ContentItem, 'id' | 'created_at' | 'age_groups' | 'categories' | 'access_tier' | 'feedback_count'>
        Update: Partial<Omit<ContentItem, 'id' | 'created_at' | 'age_groups' | 'categories' | 'access_tier' | 'feedback_count'>>
      }
      content_feedback: {
        Row: ContentFeedback
        Insert: Omit<ContentFeedback, 'id' | 'created_at'>
        Update: Partial<Omit<ContentFeedback, 'id' | 'created_at'>>
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