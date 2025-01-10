'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { SparklesIcon, LockClosedIcon } from '@heroicons/react/24/solid'
import type { ContentItem } from '@/lib/types/database'

interface ContentDetailProps {
  content: ContentItem
}

export function ContentDetail({ content }: ContentDetailProps) {
  const router = useRouter()
  const { user } = useAuth()

  const isPremium = content.access_tier?.name === 'premium'
  const isUserPremium = user?.subscription_tier?.name === 'premium'
  const isLocked = isPremium && !isUserPremium

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Logo size="medium" />
            <Button
              onClick={() => router.push('/')}
              variant="outline"
            >
              ← Grįžti
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            {content.thumbnail_url && (
              <div className={`relative mb-6 ${isLocked ? 'grayscale' : ''}`}>
                <img
                  src={content.thumbnail_url}
                  alt={content.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {isLocked && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                    <div className="bg-black/75 backdrop-blur-sm px-6 py-3 rounded-lg flex items-center gap-3 shadow-xl">
                      <LockClosedIcon className="w-6 h-6 text-yellow-400" />
                      <span className="text-lg font-medium text-white">Premium turinys</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-gray-600 text-lg mb-6">{content.description}</p>

            {/* Age Groups */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Amžiaus grupės:</h2>
              <div className="flex flex-wrap gap-2">
                {content.age_groups.map((group) => (
                  <span
                    key={group.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-black"
                  >
                    {group.range}
                  </span>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Kategorijos:</h2>
              <div className="flex flex-wrap gap-2">
                {content.categories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-900 text-white"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div className="mt-8 flex items-center justify-between">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-50 text-black">
                {content.type === 'video' && 'Video'}
                {content.type === 'audio' && 'Daina'}
                {content.type === 'lesson_plan' && 'Pamoka'}
                {content.type === 'game' && 'Žaidimas'}
              </span>
              {isPremium && !isUserPremium && (
                <Button
                  onClick={() => router.push('/pricing')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Gauti Premium
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 