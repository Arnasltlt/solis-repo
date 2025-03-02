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
        <ContentDetailHeader content={content} />
        
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
        
        <ContentDetailMetadata content={content} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <ContentDetailHeader content={content} />
      
      <ContentDetailMedia content={content} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ContentDetailBody content={content} />
        </div>
        <div className="md:col-span-1">
          <ContentDetailMetadata content={content} />
        </div>
      </div>
      
      <ContentDetailFeedback content={content} />
    </div>
  )
} 