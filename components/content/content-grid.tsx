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
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { isAdmin, canAccessPremiumContent } = useAuthorization()
  const router = useRouter()
  const { isDeleted } = useContentDelete()
  
  // Filter content based on Premium toggle, ContentType, and Deletion status
  const filteredForDisplay = content.filter(item => {
    // 1. Apply Premium Filter (if toggle is ON)
    //    This is now purely a visual filter based on the toggle state.
    if (showPremiumOnly) {
      const isPremium = item.access_tier?.name === 'premium';
      if (!isPremium) return false; // Only keep premium items if filter is ON
    }
    // If showPremiumOnly is OFF, all items pass this step.

    // 2. Apply Content Type Filter (if applicable)
    if (contentType && contentType !== 'all') {
      if (item.type !== contentType) return false;
    }

    // 3. Apply Client-Side Deletion Filter
    if (isDeleted(item.id)) return false;

    // Keep item if it passed all applicable filters
    return true;
  });

  // Handle premium content access
  const handlePremiumUpgrade = () => {
    if (!isAuthenticated) {
      router.push('/premium')
    } else {
      router.push('/premium')
    }
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] rounded-md">
      <div className="p-4 w-full overflow-x-hidden">
        {isLoading ? (
          <ContentSkeleton count={6} />
        ) : filteredForDisplay.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredForDisplay.map((item, index) => (
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