'use client'

import { useState, useMemo } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { ContentItem, AgeGroup, Category } from "@/lib/types/database"
import { ContentFilterSidebar } from './content-filter-sidebar'
import { ContentTypeTabs } from './content-type-tabs'
import { ContentGrid } from './content-grid'

interface ContentLayoutProps {
  content: ContentItem[]
  allContent: ContentItem[]
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
  showEditButtons?: boolean
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
  allContent,
  ageGroups,
  categories,
  selectedAgeGroups,
  selectedCategories,
  showPremiumOnly,
  isLoading,
  onAgeGroupSelect,
  onCategorySelect,
  onPremiumToggle,
  onRefresh,
  showEditButtons = false
}: ContentLayoutProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContent = useMemo(
    () =>
      content.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [content, searchTerm]
  )

  const CONTENT_TYPE_LABELS: Record<ContentItem['type'], string> = {
    video: 'Video',
    audio: 'Dainos',
    lesson_plan: 'Pamokos',
    game: 'Žaidimai'
  }

  const categoryMap = useMemo(() => {
    const map: Record<string, Set<string>> = { all: new Set() }
    for (const item of allContent) {
      const ids = item.categories.map((c) => c.id)
      ids.forEach((id) => map.all.add(id))
      if (!map[item.type]) map[item.type] = new Set()
      ids.forEach((id) => map[item.type].add(id))
    }
    return map
  }, [allContent])

  const contentTypes = useMemo(
    () =>
      Object.keys(categoryMap)
        .filter((t) => t !== 'all')
        .map((t) => ({
          value: t as ContentItem['type'],
          label: CONTENT_TYPE_LABELS[t as ContentItem['type']] || t
        })),
    [categoryMap]
  )

  const filteredCategories = useMemo(() => {
    const ids = categoryMap[activeTab] || new Set<string>()
    return categories.filter((cat) => ids.has(cat.id))
  }, [categories, categoryMap, activeTab])

  // Create the filter sidebar component that will be used in both desktop and mobile views
  const filterSidebar = (
    <ContentFilterSidebar
      ageGroups={ageGroups}
      categories={filteredCategories}
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
    <div className="flex h-full w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[300px] border-r border-gray-200">
        <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-6">
          {filterSidebar}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
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
              contentTypes={contentTypes}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            {/* All Content Tab */}
            <TabsContent value="all" className="m-0">
              <ContentGrid
                content={filteredContent}
                isLoading={isLoading}
                showPremiumOnly={showPremiumOnly}
                contentType="all"
                showEditButtons={showEditButtons}
              />
            </TabsContent>

            {contentTypes.map((type) => (
              <TabsContent key={type.value} value={type.value} className="m-0">
                <ContentGrid
                  content={filteredContent}
                  isLoading={isLoading}
                  showPremiumOnly={showPremiumOnly}
                  contentType={type.value}
                  showEditButtons={showEditButtons}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  )
}