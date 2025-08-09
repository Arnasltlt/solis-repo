'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { ContentLayout } from '@/components/content/content-layout'
import { useContent } from '@/lib/hooks/useContent'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import type { ContentItem, AgeGroup, Category } from '@/lib/types/database'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
 

interface HomeClientContentProps {
  initialContent: ContentItem[]
  ageGroups: AgeGroup[]
  categories: Category[]
}

export function HomeClientContent({ 
  initialContent = [], 
  ageGroups = [], 
  categories = [] 
}: { 
  initialContent?: any[], 
  ageGroups?: any[],
  categories?: any[]
}) {
  const router = useRouter()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { canAccessPremiumContent, isAdmin } = useAuthorization()
  const showEditButtons = isAdmin()
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)
  
  // Add safety checks
  const hasContent = Array.isArray(initialContent) && initialContent.length > 0
  const hasFilters = (Array.isArray(ageGroups) && ageGroups.length > 0) || 
                    (Array.isArray(categories) && categories.length > 0)

  // If we have no content, show a message
  if (!hasContent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">No content available</h2>
        <p className="text-gray-600">
          There is currently no content available to display. Please check back later.
        </p>
      </div>
    )
  }
  
  // Use the useContent hook to fetch filtered content
  const { 
    content, 
    isLoading, 
    error, 
    refresh 
  } = useContent({
    ageGroups: selectedAgeGroups.length > 0 ? selectedAgeGroups : undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    showPremiumOnly,
    initialLoad: false // Don't load on initial render, we already have initialContent
  })
  
  // Initialize content with initialContent
  const [displayContent, setDisplayContent] = useState<ContentItem[]>(initialContent)
  
  // Update displayContent when content from hook changes
  useEffect(() => {
    if (content && content.length > 0) {
      setDisplayContent(content)
    } else if (content && content.length === 0 && (selectedAgeGroups.length > 0 || selectedCategories.length > 0)) {
      // If we have filters applied and no content was found, show empty array
      setDisplayContent([])
    }
  }, [content, selectedAgeGroups.length, selectedCategories.length])
  
  // Handle age group selection
  const handleAgeGroupSelect = useCallback((id: string) => {
    setSelectedAgeGroups(prev => {
      const newAgeGroups = prev.includes(id)
        ? prev.filter(groupId => groupId !== id)
        : [...prev, id]
      
      return newAgeGroups
    })
  }, [])
  
  // Handle category selection
  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
      
      return newCategories
    })
  }, [])
  
  // Handle premium toggle - now allows everyone to filter by premium
  const handlePremiumToggle = useCallback(() => {
    // Allow everyone to filter by premium content
    setShowPremiumOnly(prev => !prev)
    
    // If premium filter is being turned on, show informational toast for non-premium users
    if (!showPremiumOnly && (!isAuthenticated || !canAccessPremiumContent())) {
      toast({
        title: "Narystės turinys",
        description: "Rodomas narystės turinys, bet prieiga prie išsamaus turinio reikalaus Narystės.",
        duration: 5000,
      })
    }
  }, [isAuthenticated, canAccessPremiumContent, showPremiumOnly])
  
  // Trigger content refresh when filters change
  useEffect(() => {
    refresh()
  }, [selectedAgeGroups, selectedCategories, refresh])
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Error fetching content:', error)
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko atnaujinti turinio.",
      })
    }
  }, [error])
  
  return (
    <>
      {showEditButtons && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-yellow-800">Admin Mode</h3>
              <p className="text-sm text-yellow-600">You can edit content directly from this page.</p>
            </div>
            <Link href="/manage/content/new">
              <Button>Create New Content</Button>
            </Link>
          </div>
        </div>
      )}
      
      
      
      <ContentLayout
        content={displayContent}
        ageGroups={ageGroups}
        categories={categories}
        selectedAgeGroups={selectedAgeGroups}
        selectedCategories={selectedCategories}
        showPremiumOnly={showPremiumOnly}
        isLoading={isLoading}
        onAgeGroupSelect={handleAgeGroupSelect}
        onCategorySelect={handleCategorySelect}
        onPremiumToggle={handlePremiumToggle}
        onRefresh={refresh}
        showEditButtons={showEditButtons}
      />
    </>
  )
} 