'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { ContentItem } from '@/lib/types/database'
import { PremiumBadge } from '@/components/ui/premium-badge'

interface ContentDetailFeedbackProps {
  content: ContentItem
}

/**
 * ContentDetailFeedback - Premium CTA component for content detail page
 */
export function ContentDetailFeedback({ content }: ContentDetailFeedbackProps) {
  const router = useRouter()
  const isPremium = content.access_tier?.name === 'premium'

  if (!isPremium) {
    return null
  }

  return (
    <div className="flex justify-end border-t pt-6">
      <Button
        onClick={() => router.push('/pricing')}
        className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700"
      >
        <PremiumBadge variant="icon" showLabel={false} className="mr-2" />
        Gauti Premium
      </Button>
    </div>
  )
} 