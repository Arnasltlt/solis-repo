import { cache } from 'react'
import { getContentItems, getContentBySlug, getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import type { ContentItem, AgeGroup, Category, AccessTier } from '@/lib/types/database'

/**
 * Cached data fetching utilities
 * 
 * These functions use React's cache() to deduplicate requests and improve performance.
 * They also provide consistent error handling.
 */

/**
 * Get all content items with optional filtering
 */
export const getCachedContentItems = cache(async ({
  ageGroup,
  categories,
  searchQuery,
}: {
  ageGroup?: string
  categories?: string[]
  searchQuery?: string
} = {}) => {
  try {
    return await getContentItems({ ageGroup, categories, searchQuery })
  } catch (error) {
    console.error('Failed to fetch content items:', error)
    throw new Error('Failed to load content. Please try again later.')
  }
})

/**
 * Get a single content item by slug
 */
export const getCachedContentBySlug = cache(async (slug: string) => {
  try {
    const content = await getContentBySlug(slug)
    if (!content) {
      throw new Error('Content not found')
    }
    return content
  } catch (error) {
    console.error(`Failed to fetch content with slug ${slug}:`, error)
    throw new Error('Failed to load content. Please try again later.')
  }
})

/**
 * Get all age groups
 */
export const getCachedAgeGroups = cache(async (): Promise<AgeGroup[]> => {
  try {
    return await getAgeGroups()
  } catch (error) {
    console.error('Failed to fetch age groups:', error)
    throw new Error('Failed to load age groups. Please try again later.')
  }
})

/**
 * Get all categories
 */
export const getCachedCategories = cache(async (): Promise<Category[]> => {
  try {
    return await getCategories()
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    throw new Error('Failed to load categories. Please try again later.')
  }
})

/**
 * Get all access tiers
 */
export const getCachedAccessTiers = cache(async (): Promise<AccessTier[]> => {
  try {
    return await getAccessTiers()
  } catch (error) {
    console.error('Failed to fetch access tiers:', error)
    throw new Error('Failed to load access tiers. Please try again later.')
  }
})

/**
 * Get all reference data (age groups, categories, access tiers)
 */
export const getCachedReferenceData = cache(async () => {
  try {
    const [ageGroups, categories, accessTiers] = await Promise.all([
      getCachedAgeGroups(),
      getCachedCategories(),
      getCachedAccessTiers(),
    ])
    
    return {
      ageGroups,
      categories,
      accessTiers,
    }
  } catch (error) {
    console.error('Failed to fetch reference data:', error)
    throw new Error('Failed to load reference data. Please try again later.')
  }
}) 