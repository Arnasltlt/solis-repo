'use client'

import { RichContentForm } from './rich-content-form'
import { cn } from '@/lib/utils/index'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { useCallback } from 'react'

// Remove getVideoEmbedUrl since it's now in the editor

interface ContentBodyDisplayProps {
  contentBody: string | null
  isPremium?: boolean
}

/**
 * ContentBodyDisplay - Component for displaying rich text content
 */
export function ContentBodyDisplay({ contentBody, isPremium = false }: ContentBodyDisplayProps) {
  const handleChange = useCallback(() => {}, [])

  console.log('[DEBUG] ContentBodyDisplay received:', {
    contentBody,
    isPremium,
    contentLength: contentBody?.length,
    contentType: typeof contentBody
  })

  if (!contentBody || contentBody === 'contentBody') {
    console.log('[DEBUG] ContentBodyDisplay returning null - no content or placeholder')
    return null
  }

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