'use client'

import { useState, useEffect } from 'react'
import { SparklesIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import { validateStorageUrl } from '@/lib/utils/index'
import type { ContentItem } from '@/lib/types/database'

interface ContentDetailInfoProps {
  content: ContentItem
}

/**
 * ContentDetailInfo - Info component for content detail page
 * 
 * This component provides:
 * - Premium badge (if applicable)
 * - Content title
 * - Thumbnail image
 */
export function ContentDetailInfo({ content }: ContentDetailInfoProps) {
  const [thumbnailError, setThumbnailError] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  
  const isPremium = content.access_tier?.name === 'premium'

  // Validate and set the thumbnail URL
  useEffect(() => {
    const validUrl = validateStorageUrl(content.thumbnail_url);
    setThumbnailUrl(validUrl);
    setThumbnailError(!validUrl);
  }, [content.thumbnail_url]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Premium Badge */}
      {isPremium && (
        <div className="px-6 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-black" />
            <span className="font-semibold text-black">Premium turinys</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h1 className="font-heading text-3xl mb-4 flex items-center gap-2">
          {content.title}
          {isPremium && (
            <SparklesIcon className="w-6 h-6 text-yellow-500" />
          )}
        </h1>

        {/* Thumbnail */}
        {thumbnailUrl && !thumbnailError ? (
          <div className="relative mb-6">
            <img
              src={thumbnailUrl}
              alt={content.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={() => setThumbnailError(true)}
            />
            {isPremium && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                <div className="bg-black/75 backdrop-blur-sm px-6 py-3 rounded-lg flex items-center gap-3 shadow-xl">
                  <LockClosedIcon className="w-6 h-6 text-yellow-400" />
                  <span className="text-lg font-medium text-white">Premium turinys</span>
                </div>
              </div>
            )}
          </div>
        ) : content.thumbnail_url ? (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg mb-6">
            <p className="text-gray-400">Failed to load image</p>
          </div>
        ) : null}

      </div>
    </div>
  )
} 