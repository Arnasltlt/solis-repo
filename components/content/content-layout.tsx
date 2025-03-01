'use client'

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import type { ContentItem, AgeGroup, Category } from "@/lib/types/database"
import { ContentFilterSidebar } from './content-filter-sidebar'
import { ContentTypeTabs } from './content-type-tabs'
import { ContentGrid } from './content-grid'

interface ContentLayoutProps {
  content: ContentItem[]
  ageGroups: AgeGroup[]
  categories: Category[]
  selectedAgeGroups: string[]
  selectedCategories: string[]
  showPremiumOnly: boolean
  isLoading: boolean
  onAgeGroupSelect: (id: string) => void
  onCategorySelect: (id: string) => void
  onPremiumToggle: () => void
  onRefresh: () => void
}

/**
 * ContentLayout - Main layout component for content browsing
 * 
 * This component combines:
 * - Filter sidebar for filtering content
 * - Type tabs for switching between content types
 * - Content grid for displaying content cards
 */
export function ContentLayout({
  content,
  ageGroups,
  categories,
  selectedAgeGroups,
  selectedCategories,
  showPremiumOnly,
  isLoading,
  onAgeGroupSelect,
  onCategorySelect,
  onPremiumToggle,
  onRefresh
}: ContentLayoutProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Create the filter sidebar component that will be used in both desktop and mobile views
  const filterSidebar = (
    <ContentFilterSidebar
      ageGroups={ageGroups}
      categories={categories}
      selectedAgeGroups={selectedAgeGroups}
      selectedCategories={selectedCategories}
      showPremiumOnly={showPremiumOnly}
      onAgeGroupSelect={onAgeGroupSelect}
      onCategorySelect={onCategorySelect}
      onPremiumToggle={onPremiumToggle}
      onClose={() => setFilterOpen(false)}
    />
  )

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[300px] border-r border-gray-200">
        <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-6">
          {filterSidebar}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs 
          defaultValue="all" 
          className="h-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <div className="px-4 py-6">
            <ContentTypeTabs
              onRefresh={onRefresh}
              filterSidebar={filterSidebar}
              isFilterOpen={filterOpen}
              onFilterOpenChange={setFilterOpen}
            />

            {/* All Content Tab */}
            <TabsContent value="all" className="m-0">
              <ContentGrid
                content={content}
                isLoading={isLoading}
                showPremiumOnly={showPremiumOnly}
                contentType="all"
              />
            </TabsContent>

            {/* Video Content Tab */}
            <TabsContent value="video" className="m-0">
              <ContentGrid
                content={content}
                isLoading={isLoading}
                showPremiumOnly={showPremiumOnly}
                contentType="video"
              />
            </TabsContent>

            {/* Audio Content Tab */}
            <TabsContent value="audio" className="m-0">
              <ContentGrid
                content={content}
                isLoading={isLoading}
                showPremiumOnly={showPremiumOnly}
                contentType="audio"
              />
            </TabsContent>

            {/* Lesson Plan Content Tab */}
            <TabsContent value="lesson_plan" className="m-0">
              <ContentGrid
                content={content}
                isLoading={isLoading}
                showPremiumOnly={showPremiumOnly}
                contentType="lesson_plan"
              />
            </TabsContent>

            {/* Game Content Tab */}
            <TabsContent value="game" className="m-0">
              <ContentGrid
                content={content}
                isLoading={isLoading}
                showPremiumOnly={showPremiumOnly}
                contentType="game"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 