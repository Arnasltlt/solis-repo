'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedback, addFeedback } from '@/lib/services/content'
import type { ContentItem } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Logo } from '@/components/ui/logo'
import { SparklesIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import { HandThumbUpIcon } from '@heroicons/react/24/solid'
import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline'
import { RichContentForm } from './rich-content-form'
import { ContentBodyDisplay } from './content-body-display'
import { cn } from '@/lib/utils/index'
import { validateStorageUrl } from '@/lib/utils/index'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ContentDetailHeader } from './content-detail-header'
import { ContentDetailMetadata } from './content-detail-metadata'
import { ContentDetailMedia } from './content-detail-media'
import { ContentDetailBody } from './content-detail-body'
import { ContentDetailFeedback } from './content-detail-feedback'
import Image from 'next/image'

interface ContentDetailProps {
  content: ContentItem
}

interface FeedbackItem {
  id: string
  rating: number
  comment?: string
}

/**
 * ContentDetail - Main component for displaying content details
 * 
 * This component orchestrates all the sub-components for the content detail page:
 * - Header (title, thumbnail, date)
 * - Media (video, audio, document, game)
 * - Metadata (age groups, categories, type)
 * - Body (rich text content)
 * - Feedback (likes/dislikes, premium CTA)
 */
export function ContentDetail({ content }: ContentDetailProps) {
  const { isAuthenticated } = useAuth()
  const { canAccessPremiumContent } = useAuthorization()
  const router = useRouter()
  const isPremium = content?.access_tier?.name === 'premium'
  const isPremiumLocked = isPremium && (!isAuthenticated || !canAccessPremiumContent())

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Turinys nepasiekiamas</p>
      </div>
    )
  }

  const handlePremiumUpgrade = () => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      router.push('/profile')
    }
  }

  if (isPremiumLocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 p-4 rounded-full">
              <LockClosedIcon className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium turinys</h2>
          <p className="text-gray-600 mb-6">
            Šis turinys yra prieinamas tik premium nariams. Atnaujinkite savo narystę, kad galėtumėte peržiūrėti šį turinį.
          </p>
          <Button onClick={handlePremiumUpgrade} className="bg-amber-600 hover:bg-amber-700">
            {isAuthenticated ? 'Atnaujinti į Premium' : 'Prisijungti'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Title and Date */}
          <div className="border-b pb-4">
            <h1 className="text-2xl font-semibold mb-2">{content.title}</h1>
            <div className="text-sm text-gray-500">
              <time dateTime={content.created_at}>
                {new Date(content.created_at).toLocaleDateString('lt-LT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>

          {/* Video Content */}
          {content.type === 'video' && content.vimeo_id && (
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src={`https://player.vimeo.com/video/${content.vimeo_id}`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          )}

          {/* Description */}
          {content.description && (
            <div className="prose max-w-none">
              <p className="text-gray-600">{content.description}</p>
            </div>
          )}

          {/* Main Content Body */}
          {content.content_body && (
            <div className="prose max-w-none">
              <ContentBodyDisplay contentBody={content.content_body} />
            </div>
          )}

          {/* Feedback Section */}
          <ContentDetailFeedback content={content} />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Thumbnail */}
          {content.thumbnail_url && (
            <div className="rounded-lg overflow-hidden relative aspect-video">
              <Image
                src={content.thumbnail_url}
                alt={content.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <ContentDetailMetadata content={content} />
          </div>
        </aside>
      </div>
    </div>
  )
} 