'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { ContentItem } from '@/lib/types/database'
import { ContentImage } from '@/components/ui/content-image'
import { ContentTypeBadge } from '@/components/ui/content-type-badge'
import { PremiumBadge } from '@/components/ui/premium-badge'
import { LockClosedIcon } from '@heroicons/react/24/solid'
import { PencilIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils/index'
import { Button } from '@/components/ui/button'
import { useAuthorization } from '@/hooks/useAuthorization'
import { DeleteContentDialog } from '@/components/content/DeleteContentDialog'
import { useRouter } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/solid'

interface ContentCardProps {
  content: ContentItem
  index?: number
  className?: string
  showDescription?: boolean
  isPremiumLocked?: boolean
  showEditButton?: boolean
}

/**
 * ContentCard component - Displays a content item in a card format
 * 
 * This component is used on the homepage and content listing pages to display
 * content items in a consistent card format.
 */
export function ContentCard({ 
  content, 
  index = 0, 
  className = '',
  showDescription = true,
  isPremiumLocked = false,
  showEditButton = false
}: ContentCardProps) {
  const isPremium = content.access_tier?.name === 'premium'
  const { isAdmin } = useAuthorization()
  const canEdit = isAdmin()
  const router = useRouter()
  
  // Handle navigation to content page
  const handleContentClick = () => {
    router.push(`/medziaga/${content.slug}`)
  }

  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer",
        isPremiumLocked && "opacity-80",
        className
      )}
      onClick={handleContentClick}
    >
      <div className="flex flex-col flex-grow">
        <div className="relative">
          <ContentImage 
            src={content.thumbnail_url}
            alt={content.title}
            priority={index < 3} // Prioritize first 3 images
            aspectRatio="video"
          />
          
          {/* Premium badge temporarily disabled
          {isPremium && (
            <div className="absolute top-2 right-2">
              <PremiumBadge />
            </div>
          )}
          
          {isPremiumLocked && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <SparklesIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          )}
          */}
        </div>
        <CardContent className="p-4 flex-grow">
          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
          {showDescription && content.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {content.description}
            </p>
          )}
          {/* Premium content text temporarily disabled
          {isPremiumLocked && (
            <p className="text-amber-600 text-sm mt-2 font-medium">
              Narystės turinys
            </p>
          )}
          */}
        </CardContent>
      </div>
      
      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <ContentTypeBadge type={content.type} variant="outline" />
        </div>
        
        {canEdit && showEditButton && (
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/manage/content/edit/${content.id}`);
              }}
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <DeleteContentDialog 
              contentId={content.id} 
              contentTitle={content.title}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}