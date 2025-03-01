import { useState, useEffect, useCallback } from 'react'
import { getContentItems } from '@/lib/services/content'
import type { ContentItem } from '@/lib/types/database'
import { handleError } from '@/lib/utils/error-handling'

interface UseContentOptions {
  ageGroups?: string[]
  categories?: string[]
  searchQuery?: string
  initialLoad?: boolean
}

export function useContent({
  ageGroups,
  categories,
  searchQuery,
  initialLoad = true
}: UseContentOptions = {}) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(initialLoad)
  const [error, setError] = useState<Error | null>(null)

  // Fetch content with the current filters
  const fetchContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    console.log('DEBUG - useContent.fetchContent called with filters:', { 
      ageGroups: ageGroups?.length ? ageGroups : 'none',
      categories: categories?.length ? categories : 'none',
      searchQuery: searchQuery || 'none' 
    })
    
    try {
      const data = await getContentItems({ 
        ageGroups, 
        categories, 
        searchQuery 
      })
      console.log(`DEBUG - useContent.fetchContent received ${data.length} items`)
      setContent(data)
    } catch (err) {
      const errorDetails = handleError(err, 'useContent')
      console.error('DEBUG - useContent.fetchContent error:', errorDetails)
      setError(new Error(errorDetails.message))
      setContent([])
    } finally {
      setIsLoading(false)
    }
  }, [ageGroups, categories, searchQuery])

  // Initial fetch and when filters change
  useEffect(() => {
    if (initialLoad) {
      console.log('DEBUG - useContent initializing with filters:', { 
        ageGroups: ageGroups?.length ? ageGroups : 'none',
        categories: categories?.length ? categories : 'none',
        searchQuery: searchQuery || 'none' 
      })
      fetchContent()
    }
  }, [ageGroups, categories, searchQuery, initialLoad, fetchContent])

  // Refresh function that can be called manually
  const refresh = useCallback(async () => {
    console.log('DEBUG - useContent.refresh called')
    await fetchContent()
  }, [fetchContent])

  return {
    content,
    isLoading,
    error,
    refresh
  }
} 