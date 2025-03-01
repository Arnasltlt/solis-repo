'use client'

import type { ContentItem } from '@/lib/types/database'
import { ContentTypeBadge } from '@/components/ui/content-type-badge'
import { AgeGroupBadge } from '@/components/ui/age-group-badge'
import { CategoryBadge } from '@/components/ui/category-badge'

interface ContentDetailMetadataProps {
  content: ContentItem
}

/**
 * ContentDetailMetadata - Metadata component for content detail page
 * 
 * This component provides:
 * - Age groups
 * - Categories
 * - Content type
 */
export function ContentDetailMetadata({ content }: ContentDetailMetadataProps) {
  return (
    <div className="space-y-6">
      {/* Age Groups */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Amžiaus grupės:</h2>
        <div className="flex flex-wrap gap-2">
          {content.age_groups.map((group) => (
            <AgeGroupBadge 
              key={group.id} 
              ageGroup={group} 
              variant="pill" 
            />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Kategorijos:</h2>
        <div className="flex flex-wrap gap-2">
          {content.categories.map((category) => (
            <CategoryBadge 
              key={category.id} 
              category={category} 
              variant="pill" 
            />
          ))}
        </div>
      </div>

      {/* Content Type */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Turinio tipas:</h2>
        <ContentTypeBadge type={content.type} variant="pill" />
      </div>
    </div>
  )
} 