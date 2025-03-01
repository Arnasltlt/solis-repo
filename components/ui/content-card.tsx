'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { ContentItem } from '@/lib/types/database'
import { ContentImage } from '@/components/ui/content-image'
import { ContentTypeBadge } from '@/components/ui/content-type-badge'
import { PremiumBadge } from '@/components/ui/premium-badge'
import { cn } from '@/lib/utils/index'

interface ContentCardProps {
  content: ContentItem
  index?: number
  className?: string
  showDescription?: boolean
}

/**
 * ContentCard component - Displays a content item in a card format
 * 
 * This component is used on the homepage and content listing pages to display
 * content items in a consistent card format.
 */
export function ContentCard({ 
  content, 
  index = 0, 
  className = '',
  showDescription = true
}: ContentCardProps) {
  const isPremium = content.access_tier?.name === 'premium'

  return (
    <Link href={`/medziaga/${content.slug}`}>
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col",
        className
      )}>
        <div className="relative">
          <ContentImage 
            src={content.thumbnail_url}
            alt={content.title}
            priority={index < 3} // Prioritize first 3 images
            aspectRatio="video"
          />
          
          {isPremium && (
            <div className="absolute top-2 right-2">
              <PremiumBadge />
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
          {showDescription && content.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {content.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <ContentTypeBadge type={content.type} variant="outline" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
} 