'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { ContentLayout } from '@/components/content/content-layout'
import { useContent } from '@/lib/hooks/useContent'
import type { ContentItem, AgeGroup, Category } from '@/lib/types/database'

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
  
  // Handle premium toggle
  const handlePremiumToggle = useCallback(() => {
    setShowPremiumOnly(prev => !prev)
  }, [])
  
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
    />
  )
} 