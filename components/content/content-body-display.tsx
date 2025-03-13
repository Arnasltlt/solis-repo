'use client'

import { useState, useEffect } from 'react'
import { RichContentForm } from './rich-content-form'
import type { ContentItem } from '@/lib/types/database'
import { cn } from '@/lib/utils/index'
import { LockClosedIcon } from '@heroicons/react/24/outline'

interface ContentBodyDisplayProps {
  contentBody: string | null
  isPremium?: boolean
}

/**
 * ContentBodyDisplay - Component for displaying rich text content
 */
export function ContentBodyDisplay({ contentBody, isPremium = false }: ContentBodyDisplayProps) {
  const [processedContent, setProcessedContent] = useState<string | null>(contentBody)
  
  // Process the content to ensure iframes are properly rendered
  useEffect(() => {
    if (!contentBody) {
      setProcessedContent(null)
      return
    }
    
    // Handle the literal 'contentBody' string case
    if (contentBody === 'contentBody') {
      setProcessedContent(null)
      return
    }
    
    try {
      // Try to parse the content as JSON
      const parsedContent = JSON.parse(contentBody)
      console.log('Content parsed as JSON:', {
        type: parsedContent.type,
        hasContent: !!parsedContent.content,
        contentLength: parsedContent.content?.length || 0
      })
      
      // The content is already in ProseMirror JSON format, so we can use it directly
      setProcessedContent(contentBody)
    } catch (error) {
      console.warn('Failed to parse content as JSON, treating as HTML:', error)
      // If it's not valid JSON, treat it as HTML
      setProcessedContent(contentBody)
    }
  }, [contentBody])
  
  const handleChange = () => {
    // This is a no-op function since we're in read-only mode
    console.log('ContentBodyDisplay: onChange called (no-op in read-only mode)');
  };

  if (!processedContent) {
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
            <RichContentForm contentBody={processedContent} readOnly onChange={handleChange} />
          </div>
        </div>
      ) : (
        <div className="prose max-w-none">
          <RichContentForm contentBody={processedContent} readOnly onChange={handleChange} />
        </div>
      )}
    </div>
  )
} 