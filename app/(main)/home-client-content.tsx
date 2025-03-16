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
import { SparklesIcon } from '@heroicons/react/24/solid'

interface HomeClientContentProps {
  initialContent: ContentItem[]
  ageGroups: AgeGroup[]
  categories: Category[]
}

export function HomeClientContent({ 
  initialContent, 
  ageGroups, 
  categories 
}: HomeClientContentProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { canAccessPremiumContent, isAdmin } = useAuthorization()
  const showEditButtons = isAdmin()
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)
  
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
      console.log('DEBUG - Updating display content with new content:', content.length)
      setDisplayContent(content)
    } else if (content && content.length === 0 && (selectedAgeGroups.length > 0 || selectedCategories.length > 0)) {
      // If we have filters applied and no content was found, show empty array
      console.log('DEBUG - No content found for filters, showing empty content')
      setDisplayContent([])
    }
  }, [content, selectedAgeGroups.length, selectedCategories.length])
  
  // Log for debugging
  useEffect(() => {
    console.log('DEBUG - Initial render:', { 
      ageGroups, 
      categories,
      initialContentLength: initialContent.length 
    })
  }, [ageGroups, categories, initialContent.length])
  
  // Handle age group selection
  const handleAgeGroupSelect = useCallback((id: string) => {
    console.log('DEBUG - Age group selected:', id)
    setSelectedAgeGroups(prev => {
      const newAgeGroups = prev.includes(id)
        ? prev.filter(groupId => groupId !== id)
        : [...prev, id]
      
      console.log('DEBUG - New age groups:', newAgeGroups)
      return newAgeGroups
    })
  }, [])
  
  // Handle category selection
  const handleCategorySelect = useCallback((id: string) => {
    console.log('DEBUG - Category selected:', id)
    setSelectedCategories(prev => {
      const newCategories = prev.includes(id)
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
      
      console.log('DEBUG - New categories:', newCategories)
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
    console.log('DEBUG - Filters changed, refreshing content:', { 
      selectedAgeGroups, 
      selectedCategories, 
      showPremiumOnly 
    })
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
      
      {/* Premium Banner for non-premium users */}
      {isAuthenticated && !canAccessPremiumContent() && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-amber-800 flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-amber-500" />
                Gaukite Narystę
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Gaukite neribotą prieigą prie viso narystės turinio.
              </p>
            </div>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap"
              onClick={() => router.push('/premium')}
            >
              Peržiūrėti Narystės Planus
            </Button>
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