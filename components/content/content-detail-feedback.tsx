'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { getFeedback, addFeedback } from '@/lib/services/content'
import { handleError } from '@/lib/utils/error-handling'
import type { ContentItem } from '@/lib/types/database'
import { ContentTypeBadge } from '@/components/ui/content-type-badge'
import { PremiumBadge } from '@/components/ui/premium-badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ContentDetailFeedbackProps {
  content: ContentItem
}

interface FeedbackItem {
  id: string
  rating: number
  comment?: string
}

/**
 * ContentDetailFeedback - Feedback component for content detail page
 * 
 * This component provides:
 * - Content type badge
 * - Like/dislike buttons with optimistic UI updates
 * - Premium CTA button (if applicable)
 */
export function ContentDetailFeedback({ content }: ContentDetailFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [optimisticLikes, setOptimisticLikes] = useState(0)
  const [optimisticDislikes, setOptimisticDislikes] = useState(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const router = useRouter()
  
  const isPremium = content.access_tier?.name === 'premium'

  useEffect(() => {
    async function loadFeedback() {
      try {
        const feedbackData = await getFeedback(content.id)
        setFeedback(feedbackData)
        
        // Reset optimistic counts when actual data is loaded
        setOptimisticLikes(0)
        setOptimisticDislikes(0)
        
        // Check if user has already rated
        // In a real app, this would check the current user's ID
        // For now, we'll just use the last feedback as an example
        if (feedbackData.length > 0) {
          const lastFeedback = feedbackData[feedbackData.length - 1]
          setUserRating(lastFeedback.rating)
        }
      } catch (error) {
        handleError(error, 'loadFeedback')
      }
    }
    loadFeedback()
  }, [content.id])

  const handleFeedback = async (rating: number) => {
    // If user already gave this rating, don't do anything
    if (userRating === rating) return
    
    // Store previous rating to revert if needed
    const previousRating = userRating
    
    // Apply optimistic update
    if (previousRating === 1) setOptimisticLikes(prev => prev - 1)
    if (previousRating === -1) setOptimisticDislikes(prev => prev - 1)
    
    if (rating === 1) setOptimisticLikes(prev => prev + 1)
    if (rating === -1) setOptimisticDislikes(prev => prev + 1)
    
    // Update user rating immediately for UI
    setUserRating(rating)
    
    // Start actual API request
    setIsLoading(true)
    try {
      await addFeedback(content.id, rating)
      toast({
        title: "Ačiū už atsiliepimą!",
        description: "Jūsų nuomonė mums labai svarbi.",
      })
      // No need to refresh the page, we've already updated the UI optimistically
    } catch (error) {
      // Revert optimistic update on error
      if (rating === 1) setOptimisticLikes(prev => prev - 1)
      if (rating === -1) setOptimisticDislikes(prev => prev - 1)
      
      // Restore previous rating
      setUserRating(previousRating)
      
      handleError(error, 'addFeedback')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate total likes and dislikes with optimistic updates
  const totalLikes = feedback.filter(f => f.rating > 0).length + optimisticLikes
  const totalDislikes = feedback.filter(f => f.rating < 0).length + optimisticDislikes

  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <ContentTypeBadge type={content.type} variant="pill" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Button
                  variant={userRating === 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleFeedback(1)}
                  disabled={isLoading}
                  className={userRating === 1 ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  👍 Patiko ({totalLikes})
                </Button>
                <Button
                  variant={userRating === -1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleFeedback(-1)}
                  disabled={isLoading}
                  className={userRating === -1 ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  👎 Nepatiko ({totalDislikes})
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Pasidalinkite savo nuomone apie šį turinį
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {isPremium && (
        <Button
          onClick={() => router.push('/pricing')}
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700"
        >
          <PremiumBadge variant="icon" showLabel={false} className="mr-2" />
          Gauti Premium
        </Button>
      )}
    </div>
  )
} 