'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { ContentCard } from "@/components/ui/content-card"
import { ContentSkeleton } from "@/components/ui/loading-state"
import type { ContentItem } from "@/lib/types/database"
import { useEffect } from "react"

interface ContentGridProps {
  content: ContentItem[]
  isLoading: boolean
  showPremiumOnly: boolean
  contentType?: string
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
  contentType
}: ContentGridProps) {
  // Add debug logging
  useEffect(() => {
    console.log('DEBUG - ContentGrid rendering with:', {
      contentCount: content.length,
      isLoading,
      showPremiumOnly,
      contentType
    })
  }, [content.length, isLoading, showPremiumOnly, contentType])

  // Filter content by premium status
  const filteredByPremium = content.filter(item => {
    const isPremium = item.access_tier?.name === 'premium'
    return !showPremiumOnly || isPremium
  })
  
  // Filter content by type if specified
  const filteredContent = contentType && contentType !== 'all'
    ? filteredByPremium.filter(item => item.type === contentType)
    : filteredByPremium

  // Log filtered results
  useEffect(() => {
    console.log('DEBUG - Content filtered:', {
      originalCount: content.length,
      afterPremiumFilter: filteredByPremium.length,
      finalFilteredCount: filteredContent.length
    })
  }, [content.length, filteredByPremium.length, filteredContent.length])

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
              />
            ))}
          </div>
        ) : (
          <div className="flex h-[450px] items-center justify-center">
            <p className="text-gray-500">
              {showPremiumOnly 
                ? 'Nerasta premium turinio pagal pasirinktus filtrus'
                : 'Nėra turinio pagal pasirinktus filtrus'}
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
} 