'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedback, addFeedback } from '@/lib/services/content'
import type { ContentItem } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Logo } from '@/components/ui/logo'
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getFeedback, addFeedback } from '@/lib/services/content'
import type { ContentItem } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Logo } from '@/components/ui/logo'
import { SparklesIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import { HandThumbUpIcon } from '@heroicons/react/24/solid'
import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline'
import { PencilIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { DeleteContentDialog } from './DeleteContentDialog'
import { RichContentForm } from './rich-content-form'
import { ContentBodyDisplay } from './content-body-display'
import { cn } from '@/lib/utils/index'
import { validateStorageUrl } from '@/lib/utils/index'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { useVideoEmbed } from '@/lib/hooks/useVideoEmbed'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ContentDetailHeader } from './content-detail-header'
import { ContentDetailMetadata } from './content-detail-metadata'
import { ContentDetailBody } from './content-detail-body'
import { ContentDetailFeedback } from './content-detail-feedback'
import { SimpleContentDetailAttachments } from './simple-content-detail-attachments'
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
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session;
  const { canAccessPremiumContent, isAdmin } = useAuthorization();
  const router = useRouter();

  const isPremium = content?.access_tier?.name === 'premium';

  const isPremiumLocked = isPremium && (!isAuthenticated || !canAccessPremiumContent());

  const canEdit = isAdmin();

  const videoUrl = content?.metadata?.mediaUrl || content?.metadata?.embed_links?.[0]
  const { videoLoaded, setVideoLoaded, embedUrl } = useVideoEmbed(videoUrl)

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Turinys nepasiekiamas</p>
      </div>
    )
  }

  const handlePremiumUpgrade = () => {
    if (!isAuthenticated) {
      router.push('/login?returnUrl=/premium')
    } else {
      router.push('/premium')
    }
  }

  if (isPremiumLocked) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content with clear header and blurred content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Title and Date - Visible */}
            <div className="border-b pb-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold mb-2 mr-2">{content.title}</h1>
                <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  Narystė
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <time dateTime={content.created_at}>
                  {new Date(content.created_at).toLocaleDateString('lt-LT')}
                </time>
              </div>
            </div>

            {/* Blurred Content Area with Overlay */}
            <div className="relative">
              <div className="blur-[8px] opacity-40 pointer-events-none select-none">
                {/* Video Content - Blurred Placeholder */}
                {content.type === 'video' && (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg">
                    {/* Blurred video content */}
                  </div>
                )}

                {/* Description - Blurred */}
                {content.description && (
                  <div className="prose max-w-none mt-4">
                    <p className="text-gray-600">{content.description}</p>
                  </div>
                )}

                {/* Dummy Content - Just for visual structure */}
                <div className="space-y-4 mt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>

              {/* Premium Content Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white shadow-2xl rounded-xl p-6 text-center max-w-md z-10">
                  <div className="flex justify-center mb-4">
                    <div className="bg-amber-100 p-4 rounded-full">
                      <SparklesIcon className="h-10 w-10 text-amber-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Narystės turinys</h2>
                  <p className="text-gray-600 mb-6">
                    Šis turinys yra prieinamas tik narystės nariams.
                  </p>
                  {!isAuthenticated ? (
                    <div className="space-y-3">
                      <Button 
                        onClick={() => router.push('/login')} 
                        className="w-full" 
                        variant="outline"
                      >
                        Prisijungti
                      </Button>
                      <Button 
                        onClick={() => router.push('/premium')} 
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        Sužinoti apie Narystę
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => router.push('/premium')} 
                      className="bg-amber-600 hover:bg-amber-700" 
                      size="lg"
                    >
                      Gauti Narystę
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Visible */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Thumbnail - Visible but with premium badge overlay */}
            {content.thumbnail_url && (
              <div className="rounded-lg overflow-hidden relative aspect-video">
                <Image
                  src={content.thumbnail_url}
                  alt={content.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('Error loading thumbnail in ContentDetail:', content.thumbnail_url);
                    // Replace with placeholder
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=No+Thumbnail';
                  }}
                />
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" /> Narystė
                </div>
              </div>
            )}

            {/* Metadata - Visible */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <ContentDetailMetadata content={content} />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Title and Date */}
          <div className="border-b pb-4 flex justify-between items-start">
            <div>
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
            
            {canEdit && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => router.push(`/manage/content/edit/${content.id}`)}
                >
                  <PencilIcon className="h-3 w-3" />
                  Edit
                </Button>
                <DeleteContentDialog 
                  contentId={content.id} 
                  contentTitle={content.title} 
                />
              </div>
            )}
          </div>

          {/* Video Content */}
          {content.type === 'video' && videoUrl && (
            <div className="aspect-w-16 aspect-h-9">
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

          {/* Attachments Section */}
          {content.metadata?.attachments && content.metadata.attachments.length > 0 && (
            <SimpleContentDetailAttachments attachments={content.metadata.attachments} />
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
                onError={(e) => {
                  console.error('Error loading thumbnail in ContentDetail:', content.thumbnail_url);
                  // Replace with placeholder
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=No+Thumbnail';
                }}
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

import { HandThumbUpIcon } from '@heroicons/react/24/solid'
import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline'
import { PencilIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { DeleteContentDialog } from './DeleteContentDialog'
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
import { ContentDetailBody } from './content-detail-body'
import { ContentDetailFeedback } from './content-detail-feedback'
import { SimpleContentDetailAttachments } from './simple-content-detail-attachments'
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
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session;
  const { canAccessPremiumContent, isAdmin } = useAuthorization();
  const router = useRouter();

  const isPremium = content?.access_tier?.name === 'premium';

  const isPremiumLocked = isPremium && (!isAuthenticated || !canAccessPremiumContent());

  const canEdit = isAdmin();

  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoUrl = content?.metadata?.mediaUrl || content?.metadata?.embed_links?.[0]

  const getEmbedUrl = (url: string) => {
    if (!url) return ''
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/i)
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`
    }
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    return url
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Turinys nepasiekiamas</p>
      </div>
    )
  }

  const handlePremiumUpgrade = () => {
    if (!isAuthenticated) {
      router.push('/login?returnUrl=/premium')
    } else {
      router.push('/premium')
    }
  }

  if (isPremiumLocked) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content with clear header and blurred content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Title and Date - Visible */}
            <div className="border-b pb-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold mb-2 mr-2">{content.title}</h1>
                <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  Narystė
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <time dateTime={content.created_at}>
                  {new Date(content.created_at).toLocaleDateString('lt-LT')}
                </time>
              </div>
            </div>

            {/* Blurred Content Area with Overlay */}
            <div className="relative">
              <div className="blur-[8px] opacity-40 pointer-events-none select-none">
                {/* Video Content - Blurred Placeholder */}
                {content.type === 'video' && (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg">
                    {/* Blurred video content */}
                  </div>
                )}

                {/* Description - Blurred */}
                {content.description && (
                  <div className="prose max-w-none mt-4">
                    <p className="text-gray-600">{content.description}</p>
                  </div>
                )}

                {/* Dummy Content - Just for visual structure */}
                <div className="space-y-4 mt-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>

              {/* Premium Content Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white shadow-2xl rounded-xl p-6 text-center max-w-md z-10">
                  <div className="flex justify-center mb-4">
                    <div className="bg-amber-100 p-4 rounded-full">
                      <SparklesIcon className="h-10 w-10 text-amber-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Narystės turinys</h2>
                  <p className="text-gray-600 mb-6">
                    Šis turinys yra prieinamas tik narystės nariams.
                  </p>
                  {!isAuthenticated ? (
                    <div className="space-y-3">
                      <Button 
                        onClick={() => router.push('/login')} 
                        className="w-full" 
                        variant="outline"
                      >
                        Prisijungti
                      </Button>
                      <Button 
                        onClick={() => router.push('/premium')} 
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        Sužinoti apie Narystę
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => router.push('/premium')} 
                      className="bg-amber-600 hover:bg-amber-700" 
                      size="lg"
                    >
                      Gauti Narystę
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Visible */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Thumbnail - Visible but with premium badge overlay */}
            {content.thumbnail_url && (
              <div className="rounded-lg overflow-hidden relative aspect-video">
                <Image
                  src={content.thumbnail_url}
                  alt={content.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('Error loading thumbnail in ContentDetail:', content.thumbnail_url);
                    // Replace with placeholder
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=No+Thumbnail';
                  }}
                />
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" /> Narystė
                </div>
              </div>
            )}

            {/* Metadata - Visible */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <ContentDetailMetadata content={content} />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Title and Date */}
          <div className="border-b pb-4 flex justify-between items-start">
            <div>
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
            
            {canEdit && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => router.push(`/manage/content/edit/${content.id}`)}
                >
                  <PencilIcon className="h-3 w-3" />
                  Edit
                </Button>
                <DeleteContentDialog 
                  contentId={content.id} 
                  contentTitle={content.title} 
                />
              </div>
            )}
          </div>

          {/* Video Content */}
          {content.type === 'video' && videoUrl && (
            <div className="aspect-w-16 aspect-h-9">
              {!videoLoaded && (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Video content will be displayed here</p>
                </div>
              )}
              <iframe
                src={getEmbedUrl(videoUrl)}
                className={`w-full h-full rounded-lg ${videoLoaded ? '' : 'hidden'}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoLoaded(true)}
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

          {/* Attachments Section */}
          {content.metadata?.attachments && content.metadata.attachments.length > 0 && (
            <SimpleContentDetailAttachments attachments={content.metadata.attachments} />
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
                onError={(e) => {
                  console.error('Error loading thumbnail in ContentDetail:', content.thumbnail_url);
                  // Replace with placeholder
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/png?text=No+Thumbnail';
                }}
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