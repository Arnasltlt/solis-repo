'use client'

import { RichContentForm } from './rich-content-form'
import type { ContentItem } from '@/lib/types/database'

interface ContentBodyDisplayProps {
  contentBody: string | null
  isPremium?: boolean
}

/**
 * ContentBodyDisplay - Component for displaying rich text content
 */
export function ContentBodyDisplay({ contentBody, isPremium = false }: ContentBodyDisplayProps) {
  if (isPremium) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500">
          This content is only available for premium users.
        </p>
      </div>
    )
  }

  if (!contentBody) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500">
          No content available.
        </p>
      </div>
    )
  }

  return (
    <div className="prose max-w-none">
      <RichContentForm
        contentBody={contentBody}
        onChange={() => {}}
        readOnly
      />
    </div>
  )
} 