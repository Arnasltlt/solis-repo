import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export type User = {
  id: string
  email: string
  subscription_tier_id: string
  created_at?: string
  tierName?: string
}

export type AccessTier = {
  id: string
  name: string
  level: number
  features: any
}

// Helper to create Supabase server client instance
const createClient = () => {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Add set/remove if these functions modify cookies
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
}

// Get all users with their subscription tier
export async function getUsers(): Promise<User[]> {
  const supabase = createClient()
  
  // Get all users with their subscription tier
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) {
    console.error('Error fetching users:', error)
    return []
  }
  
  // Get all access tiers
  const { data: tiers, error: tiersError } = await supabase
    .from('access_tiers')
    .select('*')
    
  if (tiersError) {
    console.error('Error fetching access tiers:', tiersError)
    return users || []
  }
  
  // Add tier name to each user
  const usersWithTierName = users?.map(user => {
    const tier = tiers?.find(t => t.id === user.subscription_tier_id)
    return {
      ...user,
      tierName: tier?.name
    }
  })
  
  return usersWithTierName || []
}

// Get all access tiers
export async function getAccessTiers(): Promise<AccessTier[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('access_tiers')
    .select('*')
    .order('level', { ascending: true })
    
  if (error) {
    console.error('Error fetching access tiers:', error)
    return []
  }
  
  return data || []
}

// Update user's subscription tier
export async function updateUserTier(userId: string, tierId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Update the user's subscription tier in the users table
    const { error } = await supabase
      .from('users')
      .update({ subscription_tier_id: tierId })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user tier:', error)
      return false
    }
    
    // Verify the update was successful
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('subscription_tier_id')
      .eq('id', userId)
      .single()
      
    if (verifyError) {
      console.error('Error verifying update:', verifyError)
      return false
    }
    
    return verifyUser.subscription_tier_id === tierId
  } catch (error) {
    console.error('Unexpected error in updateUserTier:', error)
    return false
  }
} 