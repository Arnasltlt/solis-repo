'use client'

import { Button } from '@/components/ui/button'
import type { ContentItem } from '@/lib/types/database'

interface ContentDetailMediaProps {
  content: ContentItem
}

/**
 * ContentDetailMedia - Media component for content detail page
 * 
 * This component provides:
 * - Video player for video content
 * - Audio player for audio content
 * - Download button for lesson plans
 * - Iframe for games
 */
export function ContentDetailMedia({ content }: ContentDetailMediaProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {content.type === 'video' && (
        <div className="aspect-w-16 aspect-h-9 mb-4">
          {content.vimeo_id ? (
            <iframe
              src={`https://player.vimeo.com/video/${content.vimeo_id}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <p className="text-gray-500">Video nepasiekiamas</p>
            </div>
          )}
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

      {content.type === 'lesson_plan' && (
        <div className="mb-4">
          {content.document_url ? (
            <div className="flex justify-center">
              <Button
                onClick={() => content.document_url && window.open(content.document_url, '_blank')}
                className="btn-primary"
              >
                Atsisiųsti pamoką
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Dokumentas nepasiekiamas</p>
            </div>
          )}
        </div>
      )}

      {content.type === 'game' && (
        <div className="mb-4">
          {content.game_assets_url ? (
            <iframe
              src={content.game_assets_url}
              className="w-full h-[600px] rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Žaidimas nepasiekiamas</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 