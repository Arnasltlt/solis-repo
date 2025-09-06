import { cache } from 'react'
import { getContentItems, getContentBySlug, getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import type { ContentItem, AgeGroup, Category, AccessTier, Database } from '@/lib/types/database'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cached data fetching utilities
 * 
 * These functions use React's cache() to deduplicate requests and improve performance.
 * They also provide consistent error handling.
 */

/**
 * Get all content items with optional filtering (Server-Side Version)
 * Creates an authenticated client using cookies.
 */
export const getCachedContentItems = cache(async ({
  ageGroups,
  categories,
  searchQuery,
  showPremiumOnly = false
}: {
  ageGroups?: string[]
  categories?: string[]
  searchQuery?: string
  showPremiumOnly?: boolean
} = {}) => {
  try {
    // Create client using the SSR helper
    const cookieStore = cookies()
    const supabaseServerClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Determine if current user is an administrator
    let isAdmin = false
    try {
      const { data: { session } } = await supabaseServerClient.auth.getSession()
      const userId = session?.user?.id
      if (userId) {
        const { data: userRow } = await supabaseServerClient
          .from('users')
          .select('subscription_tier_id')
          .eq('id', userId)
          .single()
        if (userRow?.subscription_tier_id) {
          const { data: tierRow } = await supabaseServerClient
            .from('access_tiers')
            .select('name')
            .eq('id', userRow.subscription_tier_id)
            .single()
          isAdmin = tierRow?.name === 'administrator'
        }
      }
    } catch (e) {
      // If role detection fails, default to non-admin
      isAdmin = false
    }

    // Call the service function, passing the authenticated client and other params
    const items = await getContentItems({
      ageGroups,
      categories,
      searchQuery,
      client: supabaseServerClient,
      showPremiumOnly,
      includeUnpublished: isAdmin
    })

    return items
  } catch (error) {
    console.error('Failed to fetch content items:', error)
    // Return empty array instead of throwing to avoid breaking the UI
    return []
  }
})

/**
 * Get a single content item by slug (Server-Side Version)
 */
export const getCachedContentBySlug = cache(async (slug: string) => {
  try {
    // Create client using the SSR helper
    const cookieStore = cookies()
    const supabaseServerClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Determine if current user is an administrator
    let isAdmin = false
    try {
      const { data: { session } } = await supabaseServerClient.auth.getSession()
      const userId = session?.user?.id
      if (userId) {
        const { data: userRow } = await supabaseServerClient
          .from('users')
          .select('subscription_tier_id')
          .eq('id', userId)
          .single()
        if (userRow?.subscription_tier_id) {
          const { data: tierRow } = await supabaseServerClient
            .from('access_tiers')
            .select('name')
            .eq('id', userRow.subscription_tier_id)
            .single()
          isAdmin = tierRow?.name === 'administrator'
        }
      }
    } catch (e) {
      isAdmin = false
    }

    const content = await getContentBySlug(slug, supabaseServerClient, isAdmin)
    if (!content) {
      throw new Error('Content not found or access denied')
    }
    return content
  } catch (error) {
    console.error(`Failed to fetch content with slug ${slug}:`, error)
    // Re-throw the specific error to allow the page to handle it (e.g., notFound())
    throw error
  }
})

/**
 * Get all age groups (Uses default anon client - generally OK for public ref data)
 */
export const getCachedAgeGroups = cache(async (): Promise<AgeGroup[]> => {
  try {
    // Assuming getAgeGroups uses the default anon client is acceptable here
    return await getAgeGroups()
  } catch (error) {
    console.error('Failed to fetch age groups:', error)
    // Consider returning [] instead of throwing if these aren't critical
    return []
  }
})

/**
 * Get all categories (Uses default anon client - generally OK for public ref data)
 */
export const getCachedCategories = cache(async (): Promise<Category[]> => {
  try {
    // Assuming getCategories uses the default anon client is acceptable here
    return await getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
})

/**
 * Get all access tiers (Uses default anon client - generally OK for public ref data)
 */
export const getCachedAccessTiers = cache(async (): Promise<AccessTier[]> => {
  try {
    // Assuming getAccessTiers uses the default anon client is acceptable here
    return await getAccessTiers()
  } catch (error) {
    console.error('Failed to fetch access tiers:', error)
    return []
  }
})

/**
 * Get all reference data (age groups, categories, access tiers)
 */
export const getCachedReferenceData = cache(async () => {
  try {
    // Handle each promise individually to prevent a single failure from breaking everything
    const ageGroupsPromise = getCachedAgeGroups()
    const categoriesPromise = getCachedCategories()
    const accessTiersPromise = getCachedAccessTiers()

    // Wait for all promises to resolve
    const [ageGroups, categories, accessTiers] = await Promise.all([
      ageGroupsPromise,
      categoriesPromise,
      accessTiersPromise,
    ])

    return {
      ageGroups,
      categories,
      accessTiers,
    }
  } catch (error) {
    // This catch might be redundant now if sub-fetches return [] on error
    console.error('Failed to fetch reference data wrapper:', error)
    // Return empty objects instead of throwing
    return {
      ageGroups: [],
      categories: [],
      accessTiers: [],
    }
  }
}) 
