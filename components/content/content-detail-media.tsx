'use client'

import type { ContentItem } from '@/lib/types/database'
import { useVideoEmbed } from '@/lib/hooks/useVideoEmbed'

interface ContentDetailMediaProps {
  content: ContentItem
}

/**
 * ContentDetailMedia - Media component for content detail page
 * 
 * This component provides:
 * - Video player for video content
 * - Audio player for audio content
 */
export function ContentDetailMedia({ content }: ContentDetailMediaProps) {
  const videoUrl = content.metadata?.mediaUrl || content.metadata?.embed_links?.[0]
  const { videoLoaded, setVideoLoaded, embedUrl } = useVideoEmbed(videoUrl)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {content.type === 'video' && videoUrl && (
        <div className="aspect-w-16 aspect-h-9 mb-4">
          {!videoLoaded && (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <p className="text-gray-500">Video content will be displayed here</p>
            </div>
          )}
          <iframe
            src={embedUrl}
            className={`w-full h-full rounded-lg ${videoLoaded ? '' : 'hidden'}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setVideoLoaded(true)}
          />
        </div>
      )}

      {content.type === 'audio' && (
        <div className="mb-4">
          {content.audio_url ? (
            <audio
              controls
              className="w-full"
              src={content.audio_url}
            >
              Jūsų naršyklė nepalaiko audio elemento.
            </audio>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Audio failas nepasiekiamas</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 