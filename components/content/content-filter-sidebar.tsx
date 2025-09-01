'use client'

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SparklesIcon } from "@heroicons/react/24/solid"
import type { AgeGroup, Category } from "@/lib/types/database"

interface ContentFilterSidebarProps {
  ageGroups: AgeGroup[]
  categories: Category[]
  selectedAgeGroups: string[]
  selectedCategories: string[]
  showPremiumOnly: boolean
  onAgeGroupSelect: (id: string) => void
  onCategorySelect: (id: string) => void
  onPremiumToggle: () => void
  onClose?: () => void
  className?: string
}

/**
 * ContentFilterSidebar - Sidebar component for filtering content
 * 
 * This component provides filters for:
 * - Premium content toggle
 * - Age group selection (multiple)
 * - Category selection (multiple)
 */
export function ContentFilterSidebar({
  ageGroups,
  categories,
  selectedAgeGroups,
  selectedCategories,
  showPremiumOnly,
  onAgeGroupSelect,
  onCategorySelect,
  onPremiumToggle,
  onClose,
  className = ""
}: ContentFilterSidebarProps) {
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters section completely removed since there's only premium filter
      <div>
        <h3 className="mb-2 text-lg font-semibold">Filtrai</h3>
        <button
          onClick={() => {
            onPremiumToggle()
            onClose?.()
          }}
          className={`flex w-full items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showPremiumOnly
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white text-foreground hover:bg-yellow-100'
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          Narystės turinys
        </button>
      </div>
      <Separator />
      */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">Amžiaus grupės</h3>
        <div className="space-y-1">
          {ageGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                onAgeGroupSelect(group.id)
                onClose?.()
              }}
              className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                selectedAgeGroups.includes(group.id)
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
        <h3 className="mb-2 text-lg font-semibold">Temos</h3>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                onCategorySelect(category.id)
                onClose?.()
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
} 