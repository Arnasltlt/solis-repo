'use client'

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FunnelIcon } from "@heroicons/react/24/solid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReactNode } from "react"

interface ContentTypeTabsProps {
  onRefresh: () => void
  filterSidebar: ReactNode
  isFilterOpen: boolean
  onFilterOpenChange: (open: boolean) => void
  searchTerm: string
  onSearchChange: (value: string) => void
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
  searchTerm,
  onSearchChange
}: ContentTypeTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
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
        <TabsList className="bg-secondary-navy/10 w-full overflow-x-auto whitespace-nowrap justify-start pl-3 pr-3 gap-2 snap-x">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white shrink-0 snap-start"
          >
            Visi
          </TabsTrigger>
          <TabsTrigger 
            value="video"
            className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white shrink-0 snap-start"
          >
            Video
          </TabsTrigger>
          <TabsTrigger 
            value="audio"
            className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white shrink-0 snap-start"
          >
            Dainos
          </TabsTrigger>
          <TabsTrigger 
            value="lesson_plan"
            className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white shrink-0 snap-start"
          >
            Pamokos
          </TabsTrigger>
          <TabsTrigger 
            value="game"
            className="data-[state=active]:bg-secondary-navy data-[state=active]:text-white shrink-0 snap-start"
          >
            Žaidimai
          </TabsTrigger>
        </TabsList>
      </div>
      {/* Search - mobile full width below tabs; desktop right-aligned */}
      <div className="w-full sm:max-w-xs sm:ml-auto">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ieškoti turinio..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
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