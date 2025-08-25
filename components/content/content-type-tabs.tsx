'use client'

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FunnelIcon } from "@heroicons/react/24/solid"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReactNode } from "react"
import type { ContentItem } from "@/lib/types/database"

interface ContentTypeTabsProps {
  onRefresh: () => void
  filterSidebar: ReactNode
  isFilterOpen: boolean
  onFilterOpenChange: (open: boolean) => void
  contentTypes: { value: ContentItem['type']; label: string }[]
}

/**
 * ContentTypeTabs - Tab navigation for content types
 * 
 * This component provides:
 * - Tabs for filtering content by type (all, videos, audio, lessons, games)
 * - Mobile filter button that opens a sheet with filters
 * - Refresh button
 */
export function ContentTypeTabs({
  onRefresh,
  filterSidebar,
  isFilterOpen,
  onFilterOpenChange,
  contentTypes
}: ContentTypeTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-4">
        {/* Mobile Filter Button */}
        <Sheet open={isFilterOpen} onOpenChange={onFilterOpenChange}>
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
              {filterSidebar}
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
          {contentTypes.map((type) => (
            <TabsTrigger
              key={type.value}
              value={type.value}
              className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white"
            >
              {type.label}
            </TabsTrigger>
          ))}
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
  )
} 