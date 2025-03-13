'use client'

import { useState } from 'react'
import { ContentLayout } from './content-layout'
import type { ContentItem, AgeGroup, Category } from '@/lib/types/database'

interface AdminContentBrowserProps {
  content: ContentItem[]
  ageGroups: AgeGroup[]
  categories: Category[]
}

export function AdminContentBrowser({
  content,
  ageGroups,
  categories
}: AdminContentBrowserProps) {
  // Define the handler functions here, in a client component
  const handleAgeGroupSelect = (id: string) => {
    // No-op for now, could implement filtering later
    console.log('Age group selected:', id)
  }
  
  const handleCategorySelect = (id: string) => {
    // No-op for now, could implement filtering later
    console.log('Category selected:', id)
  }
  
  const handlePremiumToggle = () => {
    // No-op for now, could implement filtering later
    console.log('Premium toggle clicked')
  }
  
  const handleRefresh = () => {
    // No-op for now, could implement refresh later
    console.log('Refresh requested')
  }
  
  return (
    <ContentLayout
      content={content}
      ageGroups={ageGroups}
      categories={categories}
      selectedAgeGroups={[]}
      selectedCategories={[]}
      showPremiumOnly={false}
      isLoading={false}
      onAgeGroupSelect={handleAgeGroupSelect}
      onCategorySelect={handleCategorySelect}
      onPremiumToggle={handlePremiumToggle}
      onRefresh={handleRefresh}
      showEditButtons={true}
    />
  )
}