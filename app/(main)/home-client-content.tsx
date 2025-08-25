'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { canAccessPremiumContent, isAdmin } = useAuthorization()
  const showEditButtons = isAdmin()
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)

  // Read filters from URL on initial load
  useEffect(() => {
    const ageGroupsParam = searchParams.get('ageGroups')
    const categoriesParam = searchParams.get('categories')
    const premiumParam = searchParams.get('premium')

    if (ageGroupsParam) {
      setSelectedAgeGroups(ageGroupsParam.split(',').filter(Boolean))
    }
    if (categoriesParam) {
      setSelectedCategories(categoriesParam.split(',').filter(Boolean))
    }
    if (premiumParam === '1' || premiumParam === 'true') {
      setShowPremiumOnly(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Add safety checks
  const hasContent = Array.isArray(initialContent) && initialContent.length > 0
  const hasFilters = (Array.isArray(ageGroups) && ageGroups.length > 0) || 
                    (Array.isArray(categories) && categories.length > 0)

  // If we have no content, show a message
  if (!hasContent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Turinio nėra</h2>
        <p className="text-gray-600">
          Šiuo metu nėra turinio. Prašome užsukti vėliau.
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
  }, [selectedAgeGroups, selectedCategories, showPremiumOnly, refresh])

  // Sync filter state with URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedAgeGroups.length > 0) {
      params.set('ageGroups', selectedAgeGroups.join(','))
    }
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','))
    }
    if (showPremiumOnly) {
      params.set('premium', '1')
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [selectedAgeGroups, selectedCategories, showPremiumOnly, pathname, router])
  
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
              <h3 className="font-medium text-yellow-800">Administratoriaus režimas</h3>
              <p className="text-sm text-yellow-600">Galite redaguoti turinį tiesiogiai šiame puslapyje.</p>
            </div>
            <Link href="/manage/content/new">
              <Button>Kurti naują turinį</Button>
            </Link>
          </div>
        </div>
      )}
      
      
      
      <ContentLayout
        content={displayContent}
        allContent={initialContent}
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
