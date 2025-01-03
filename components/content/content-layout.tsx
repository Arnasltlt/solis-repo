'use client'

import { useState } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentCard } from "@/components/ui/content-card"
import { SparklesIcon, FunnelIcon } from "@heroicons/react/24/solid"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { ContentItem, AgeGroup, Category } from "@/lib/types/database"

interface ContentLayoutProps {
  content: ContentItem[]
  ageGroups: AgeGroup[]
  categories: Category[]
  selectedAgeGroup?: string
  selectedCategories: string[]
  showPremiumOnly: boolean
  isLoading: boolean
  onAgeGroupSelect: (id: string | undefined) => void
  onCategorySelect: (id: string) => void
  onPremiumToggle: () => void
  onRefresh: () => void
}

export function ContentLayout({
  content,
  ageGroups,
  categories,
  selectedAgeGroup,
  selectedCategories,
  showPremiumOnly,
  isLoading,
  onAgeGroupSelect,
  onCategorySelect,
  onPremiumToggle,
  onRefresh
}: ContentLayoutProps) {
  const [open, setOpen] = useState(false)
  const filteredContent = content.filter(item => 
    !showPremiumOnly || (item.access_tier?.name === 'premium')
  )

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Filtrai</h3>
        <button
          onClick={() => {
            onPremiumToggle()
            setOpen(false)
          }}
          className={`flex w-full items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showPremiumOnly
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white text-foreground hover:bg-yellow-100'
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          Premium turinys
        </button>
      </div>
      <Separator />
      <div>
        <h3 className="mb-2 text-lg font-semibold">Amžiaus grupės</h3>
        <div className="space-y-1">
          {ageGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                onAgeGroupSelect(
                  selectedAgeGroup === group.id ? undefined : group.id
                )
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                selectedAgeGroup === group.id
                  ? 'bg-yellow-500 text-black'
                  : 'hover:bg-yellow-100'
              }`}
            >
              {group.range}
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="mb-2 text-lg font-semibold">Kategorijos</h3>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                onCategorySelect(category.id)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                selectedCategories.includes(category.id)
                  ? 'bg-secondary-navy text-white'
                  : 'hover:bg-secondary-navy/10'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[300px] border-r border-gray-200">
        <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-6">
          <FilterContent />
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs defaultValue="all" className="h-full">
          <div className="px-4 py-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <FunnelIcon className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtrai</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                      <FilterContent />
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
                <TabsList className="bg-secondary-navy/10">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white"
                  >
                    Visi
                  </TabsTrigger>
                  <TabsTrigger 
                    value="videos"
                    className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white"
                  >
                    Video
                  </TabsTrigger>
                  <TabsTrigger 
                    value="audio"
                    className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white"
                  >
                    Dainos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lessons"
                    className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white"
                  >
                    Pamokos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="games"
                    className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white"
                  >
                    Žaidimai
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button
                onClick={onRefresh}
                variant="outline"
                size="icon"
                className="self-end sm:self-auto"
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </Button>
            </div>

            <TabsContent value="all" className="m-0">
              <ScrollArea className="h-[calc(100vh-12rem)] rounded-md">
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex h-[450px] items-center justify-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    </div>
                  ) : filteredContent.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredContent.map((item) => (
                        <ContentCard key={item.id} content={item} />
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
            </TabsContent>

            {/* Add other tab contents with filtered content by type */}
            {['videos', 'audio', 'lessons', 'games'].map((type) => (
              <TabsContent key={type} value={type} className="m-0">
                <ScrollArea className="h-[calc(100vh-12rem)] rounded-md">
                  <div className="p-4">
                    {isLoading ? (
                      <div className="flex h-[450px] items-center justify-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredContent
                          .filter(item => item.type === type)
                          .map((item) => (
                            <ContentCard key={item.id} content={item} />
                          ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  )
} 