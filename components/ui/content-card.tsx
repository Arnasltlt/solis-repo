import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SparklesIcon } from '@heroicons/react/24/solid'
import type { ContentItem } from '@/lib/types/database'
import { useAuth } from '@/lib/context/auth'
import { cn } from '@/lib/utils'

// Keep track of already logged content IDs
const loggedMissingThumbnails = new Set<string>()

interface ContentCardProps {
  content: ContentItem
  showAgeGroups?: boolean
  showCategories?: boolean
}

interface AgeGroup {
  id: string
  range: string
}

interface Category {
  id: string
  name: string
}

export function ContentCard({ content, showAgeGroups = true, showCategories = true }: ContentCardProps) {
  const { user } = useAuth()

  useEffect(() => {
    // Only log if thumbnail is missing and hasn't been logged before
    if (!content.thumbnail_url && !loggedMissingThumbnails.has(content.id)) {
      console.log('Content missing thumbnail:', {
        id: content.id,
        title: content.title
      })
      loggedMissingThumbnails.add(content.id)
    }
  }, [content.id, content.thumbnail_url, content.title])

  const isPremium = content.access_tier?.name === 'premium'
  const isUserPremium = user?.subscription_tier?.name === 'premium'
  const isLocked = isPremium && !isUserPremium

  return (
    <Card className="overflow-hidden group relative">
      <Link href={`/medziaga/${content.slug}`} className="block">
        <div className="relative aspect-video">
          {content.thumbnail_url ? (
            <Image
              src={content.thumbnail_url}
              alt={content.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No thumbnail</span>
            </div>
          )}
          {isPremium && (
            <div className="absolute top-2 right-2">
              <Badge variant="premium" className="gap-1">
                <SparklesIcon className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-heading text-lg group-hover:underline">
              {content.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {content.description}
            </p>
            {showAgeGroups && content.age_groups.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.age_groups.map(group => (
                  <Badge key={group.id} variant="outline">
                    {group.range}
                  </Badge>
                ))}
              </div>
            )}
            {showCategories && content.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.categories.map(category => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
} 