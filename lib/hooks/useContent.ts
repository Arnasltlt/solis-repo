import { useState, useEffect, useCallback, useMemo } from 'react'
import { getContentItems } from '@/lib/services/content'
import type { ContentItem, Database } from '@/lib/types/database'
import { handleError } from '@/lib/utils/error-handling'
import { createBrowserClient } from '@supabase/ssr'

interface UseContentOptions {
  ageGroups?: string[]
  categories?: string[]
  searchQuery?: string
  initialLoad?: boolean
  showPremiumOnly?: boolean
}

export function useContent({
  ageGroups,
  categories,
  searchQuery,
  initialLoad = true,
  showPremiumOnly = false
}: UseContentOptions = {}) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(initialLoad)
  const [error, setError] = useState<Error | null>(null)

  // Create Supabase client instance - useMemo ensures it's stable
  const supabase = useMemo(() => createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Fetch content with the current filters
  const fetchContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Pass the authenticated client to the service function
      const data = await getContentItems({ 
        ageGroups, 
        categories, 
        searchQuery,
        showPremiumOnly,
        client: supabase
      })
      setContent(data)
    } catch (err) {
      const errorDetails = handleError(err, 'useContent')
      console.error('Error fetching content:', errorDetails)
      setError(new Error(errorDetails.message))
      setContent([])
    } finally {
      setIsLoading(false)
    }
  }, [ageGroups, categories, searchQuery, showPremiumOnly, supabase])

  // Initial fetch and when filters change
  useEffect(() => {
    if (initialLoad) {
      fetchContent()
    }
  }, [ageGroups, categories, searchQuery, showPremiumOnly, initialLoad, fetchContent])

  // Refresh function that can be called manually
  const refresh = useCallback(async () => {
    await fetchContent()
  }, [fetchContent])

  return {
    content,
    isLoading,
    error,
    refresh
  }
} 