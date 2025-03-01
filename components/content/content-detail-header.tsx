'use client'

import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { ContentImage } from '@/components/ui/content-image'
import type { ContentItem } from '@/lib/types/database'

interface ContentDetailHeaderProps {
  content: ContentItem
}

/**
 * Format a date string to a more readable format
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * ContentDetailHeader - Header component for content detail page
 * 
 * This component provides:
 * - Title
 * - Thumbnail image
 * - Publication date
 * - Estimated duration
 */
export function ContentDetailHeader({ content }: ContentDetailHeaderProps) {
  // Extract duration from metadata if available
  const duration = content.metadata?.duration || null

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{content.title}</h1>
      
      <ContentImage
        src={content.thumbnail_url}
        alt={content.title}
        priority
        className="rounded-lg"
      />
      
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>Publikuota: {formatDate(content.created_at)}</span>
        </div>
        {duration && (
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>Trukmė: {duration} min.</span>
          </div>
        )}
      </div>
    </div>
  )
} 