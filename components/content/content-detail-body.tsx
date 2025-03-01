'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import type { ContentItem } from '@/lib/types/database'
import { ContentBodyDisplay } from './content-body-display'

interface ContentDetailBodyProps {
  content: ContentItem
}

/**
 * ContentDetailBody - Body content component for content detail page
 * 
 * This component provides:
 * - Rich text content display
 * - Show/hide toggle for content
 */
export function ContentDetailBody({ content }: ContentDetailBodyProps) {
  const [isContentVisible, setIsContentVisible] = useState(true)

  // If there's no content body, don't render anything
  if (!content.content_body) {
    return null
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Turinys</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsContentVisible(!isContentVisible)}
        >
          {isContentVisible ? (
            <>
              <EyeSlashIcon className="h-4 w-4 mr-2" />
              Slėpti turinį
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4 mr-2" />
              Rodyti turinį
            </>
          )}
        </Button>
      </div>
      
      {isContentVisible && (
        <ContentBodyDisplay contentBody={content.content_body} />
      )}
    </div>
  )
} 