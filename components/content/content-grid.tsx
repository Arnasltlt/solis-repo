'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { ContentCard } from "@/components/ui/content-card"
import { ContentSkeleton } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useAuthorization } from "@/hooks/useAuthorization"
import { useRouter } from "next/navigation"
import type { ContentItem } from "@/lib/types/database"
import { useEffect } from "react"
import { useContentDelete } from './ContentDeleteManager'

interface ContentGridProps {
  content: ContentItem[]
  isLoading: boolean
  showPremiumOnly: boolean
  contentType?: string
  showEditButtons?: boolean
}

/**
 * ContentGrid - Grid layout for displaying content cards
 * 
 * This component:
 * - Displays content items in a responsive grid
 * - Shows loading spinner when content is loading
 * - Filters content by type if specified
 * - Shows empty state message when no content matches filters
 */
export function ContentGrid({
  content,
  isLoading,
  showPremiumOnly,
  contentType,
  showEditButtons = false
}: ContentGridProps) {
  const { isAuthenticated } = useAuth()
  const { canAccessPremiumContent } = useAuthorization()
  const router = useRouter()
  const { isDeleted } = useContentDelete()
  
  // Add debug logging
  useEffect(() => {
    console.log('DEBUG - ContentGrid rendering with:', {
      contentCount: content.length,
      isLoading,
      showPremiumOnly,
      contentType
    })
  }, [content.length, isLoading, showPremiumOnly, contentType])

  // Filter content by premium status and user access
  const filteredByPremium = content.filter(item => {
    const isPremium = item.access_tier?.name === 'premium'
    
    // If not premium content, show to everyone
    if (!isPremium) return true
    
    // If premium content, check if user can access it
    if (isAuthenticated && canAccessPremiumContent()) {
      return true
    }
    
    // If showing premium only, include premium items even if user can't access them
    // (they'll be shown with a lock icon or upgrade prompt)
    return showPremiumOnly
  })
  
  // Filter content by type if specified
  let filteredContent = contentType && contentType !== 'all'
    ? filteredByPremium.filter(item => item.type === contentType)
    : filteredByPremium
    
  // Filter out deleted content
  // But only on the client-side to avoid hydration mismatches
  if (typeof window !== 'undefined') {
    filteredContent = filteredContent.filter(item => !isDeleted(item.id))
  }

  // Log filtered results
  useEffect(() => {
    console.log('DEBUG - Content filtered:', {
      originalCount: content.length,
      afterPremiumFilter: filteredByPremium.length,
      finalFilteredCount: filteredContent.length
    })
  }, [content.length, filteredByPremium.length, filteredContent.length])

  // Handle premium content access
  const handlePremiumUpgrade = () => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      router.push('/profile')
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] rounded-md">
      <div className="p-4">
        {isLoading ? (
          <ContentSkeleton count={6} />
        ) : filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item, index) => (
              <ContentCard 
                key={item.id} 
                content={item} 
                index={index}
                isPremiumLocked={item.access_tier?.name === 'premium' && (!isAuthenticated || !canAccessPremiumContent())}
                showEditButton={showEditButtons}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-[450px] items-center justify-center gap-4">
            <p className="text-gray-500">
              {showPremiumOnly 
                ? 'Nerasta premium turinio pagal pasirinktus filtrus'
                : 'Nėra turinio pagal pasirinktus filtrus'}
            </p>
            {showPremiumOnly && !canAccessPremiumContent() && (
              <Button onClick={handlePremiumUpgrade}>
                {isAuthenticated ? 'Atnaujinti į Premium' : 'Prisijungti'}
              </Button>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}