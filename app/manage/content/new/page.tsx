import { getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'
import { serializeForClient } from '@/lib/utils/serialization'
import { NewContentEditor } from './NewContentEditor'

export default async function NewContentPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Check if user is authenticated and is admin
  const { data: { session } } = await supabase.auth.getSession()
  
  // Don't redirect immediately, let client-side auth handle this
  // This prevents redirecting if there's a valid session in the browser
  // that hasn't been synchronized with the server yet
  
  // Default values
  let userData = null
  let adminTier = null
  let isAdmin = false
  
  // Only try to get user data if we have a session
  if (session?.user?.id) {
    // Get the user's role
    const userDataResult = await supabase
      .from('users')
      .select('subscription_tier_id')
      .eq('id', session.user.id)
      .single()
    
    userData = userDataResult.data
    
    // Get admin tier info
    const adminTierResult = await supabase
      .from('access_tiers')
      .select('id')
      .eq('name', 'administrator')
      .single()
    
    adminTier = adminTierResult.data
    
    // Check if user is admin
    isAdmin = userData?.subscription_tier_id === adminTier?.id
  }
  
  // Don't redirect server-side, let the client component handle it
  // Client-side auth checks will redirect if needed
  
  // Fetch required data for content creation
  const [ageGroups, categories, accessTiers] = await Promise.all([
    getAgeGroups(supabase),
    getCategories(supabase),
    getAccessTiers(supabase)
  ])
  
  // Serialize data before passing to client component
  const serializedAgeGroups = serializeForClient(ageGroups)
  const serializedCategories = serializeForClient(categories)
  const serializedAccessTiers = serializeForClient(accessTiers)
  
  return (
    <NewContentEditor
      ageGroups={serializedAgeGroups}
      categories={serializedCategories}
      accessTiers={serializedAccessTiers}
    />
  )
}