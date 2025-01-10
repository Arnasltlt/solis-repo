import { useEffect } from 'react'
import type { ContentItem } from '@/lib/types/database'
import type { User } from '@/lib/types/auth'
import { useAuth } from '@/lib/context/auth'
import { LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'

// Keep track of already logged content IDs
const loggedMissingThumbnails = new Set<string>()

interface ContentCardProps {
  content: ContentItem
}

interface AgeGroup {
  id: string
  range: string
}

interface Category {
  id: string
  name: string
}

export function ContentCard({ content }: ContentCardProps) {
  const { user } = useAuth()
  const router = useRouter()

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
    <div 
      onClick={() => router.push(`/medziaga/${content.slug}`)}
      className={`bg-white rounded-lg shadow-md overflow-hidden relative group ${isLocked ? 'opacity-90' : ''} cursor-pointer hover:shadow-xl transition-shadow duration-200`}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg">
            <SparklesIcon className="w-4 h-4" />
            Premium
          </div>
        </div>
      )}

      {/* Thumbnail with Premium Overlay */}
      <div className="relative">
        {content.thumbnail_url && (
          <div className={`relative ${isLocked ? 'grayscale' : ''} transition-all duration-200`}>
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-full h-48 object-cover"
            />
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="bg-black/75 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl">
                  <LockClosedIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Premium turinys</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-2xl mb-2 flex items-center gap-2">
          {content.title}
          {isPremium && (
            <SparklesIcon className="w-4 h-4 text-yellow-500" />
          )}
        </h3>
        <p className="text-gray-600 text-sm mb-4">{content.description}</p>
        
        {/* Age Groups */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Amžiaus grupės:</h4>
          <div className="flex flex-wrap gap-1">
            {content.age_groups.map((group: AgeGroup) => (
              <span
                key={group.id}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-yellow-100 text-black"
              >
                {group.range}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Kategorijos:</h4>
          <div className="flex flex-wrap gap-1">
            {content.categories.map((category: Category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-gray-900 text-white"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer: Type and Access Level */}
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-yellow-50 text-black">
            {content.type === 'video' && 'Video'}
            {content.type === 'audio' && 'Daina'}
            {content.type === 'lesson_plan' && 'Pamoka'}
            {content.type === 'game' && 'Žaidimas'}
          </span>
          {isPremium && (
            <span className="text-sm text-gray-500 font-medium">
              Premium turinys
            </span>
          )}
        </div>
      </div>
    </div>
  )
} 