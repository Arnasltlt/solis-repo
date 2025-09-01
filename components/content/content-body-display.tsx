'use client'

import { RichContentForm } from './rich-content-form'
import { cn } from '@/lib/utils/index'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { useCallback } from 'react'

// Remove getVideoEmbedUrl since it's now in the editor

interface ContentBodyDisplayProps {
  contentBody: string | null
  contentBodyHtml?: string | null
  isPremium?: boolean
}

/**
 * ContentBodyDisplay - Component for displaying rich text content
 */
export function ContentBodyDisplay({ contentBody, contentBodyHtml, isPremium = false }: ContentBodyDisplayProps) {
  const handleChange = useCallback(() => {}, [])

  // Reduce noisy logs
  // console.debug('[ContentBodyDisplay]', { hasHtml: !!contentBodyHtml, len: contentBody?.length })

  if (!contentBody || contentBody === 'contentBody') {
    console.log('[DEBUG] ContentBodyDisplay returning null - no content or placeholder')
    return null
  }

  // Use HTML version if available, otherwise fall back to editor rendering
  if (contentBodyHtml && contentBodyHtml.trim() !== '') {
    // Using HTML snapshot for display
    return (
      <div className="rich-content-display">
        {isPremium ? (
          <div className="relative">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
              <LockClosedIcon className="h-8 w-8 text-primary mb-2" />
              <p className="text-center font-medium">This content is available for premium users only.</p>
            </div>
            <div className="blur-sm">
              <div 
                className="prose max-w-none p-4"
                dangerouslySetInnerHTML={{ __html: contentBodyHtml }}
              />
            </div>
          </div>
        ) : (
          <div 
            className="prose max-w-none p-4"
            dangerouslySetInnerHTML={{ __html: contentBodyHtml }}
          />
        )}
      </div>
    )
  }

  // Fallback to editor rendering for content without HTML version
  // Fallback to editor rendering if no HTML snapshot is available
  return (
    <div className="rich-content-display">
      {isPremium ? (
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
            <LockClosedIcon className="h-8 w-8 text-primary mb-2" />
            <p className="text-center font-medium">This content is available for premium users only.</p>
          </div>
          <div className="blur-sm">
            <RichContentForm contentBody={contentBody} readOnly onChange={handleChange} />
          </div>
        </div>
      ) : (
        <RichContentForm contentBody={contentBody} readOnly onChange={handleChange} />
      )}
    </div>
  )
} 