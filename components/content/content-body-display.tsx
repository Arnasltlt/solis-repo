'use client'

import { RichContentForm } from './rich-content-form'
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
  
  // No need for useEffect or state here, pass contentBody directly

  const handleChange = () => {
    // This is a no-op function since we're in read-only mode
  };

  // Handle the literal 'contentBody' string case or null/empty
  if (!contentBody || contentBody === 'contentBody') {
    return null // Or render a placeholder if desired
  }

  // Basic check if content looks like JSON (might need refinement)
  const seemsLikeJson = contentBody.trim().startsWith('{');

  if (!seemsLikeJson) {
    // If it doesn't seem like JSON, maybe render it as raw HTML (use cautiously)
    // Or display an error/placeholder
    console.warn("ContentBodyDisplay received non-JSON content:", contentBody.substring(0, 100))
    // For safety, returning null. Adjust if HTML rendering is desired.
    return null; 
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
            {/* Pass the JSON string directly */}
            <RichContentForm contentBody={contentBody} readOnly onChange={handleChange} />
          </div>
        </div>
      ) : (
        <div className="prose max-w-none">
          {/* Pass the JSON string directly */}
          <RichContentForm contentBody={contentBody} readOnly onChange={handleChange} />
        </div>
      )}
    </div>
  )
} 