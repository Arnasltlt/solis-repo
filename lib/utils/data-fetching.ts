import { cache } from 'react'
import { getContentItems, getContentBySlug, getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import type { ContentItem, AgeGroup, Category, AccessTier, Database } from '@/lib/types/database'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
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
    // Create authenticated client for server-side fetching
    const cookieStore = cookies()
    const supabaseServerClient = createServerComponentClient<Database>({ cookies: () => cookieStore })

    // Call the service function, passing the authenticated client and other params
    const items = await getContentItems({
      ageGroups,
      categories,
      searchQuery,
      client: supabaseServerClient,
      showPremiumOnly
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
    // Create authenticated client for server-side fetching
    const cookieStore = cookies()
    const supabaseServerClient = createServerComponentClient<Database>({ cookies: () => cookieStore })
    
    const content = await getContentBySlug(slug, supabaseServerClient)
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