import { useState, useEffect } from 'react'
import { getContentItems } from '@/lib/services/content'
import type { ContentItem } from '@/lib/types/database'
import { handleError } from '@/lib/utils/error'

interface UseContentOptions {
  ageGroup?: string
  categories?: string[]
  searchQuery?: string
  initialLoad?: boolean
}

export function useContent({
  ageGroup,
  categories,
  searchQuery,
  initialLoad = true
}: UseContentOptions = {}) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(initialLoad)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getContentItems({ ageGroup, categories, searchQuery })
        setContent(data)
      } catch (err) {
        const error = handleError(err)
        setError(error)
        setContent([])
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [ageGroup, categories, searchQuery])

  const refresh = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getContentItems({ ageGroup, categories, searchQuery })
      setContent(data)
    } catch (err) {
      const error = handleError(err)
      setError(error)
      setContent([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    content,
    isLoading,
    error,
    refresh
  }
} 