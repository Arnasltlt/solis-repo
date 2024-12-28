import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User extends SupabaseUser {
  subscription_tier_id?: string
  subscription_tier?: {
    id: string
    name: string
    level: number
    features: Record<string, any>
  }
  user_metadata: {
    subscription_tier_id?: string
  }
} 