'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/index"

type ContentType = 'video' | 'audio' | 'lesson_plan' | 'game'

interface ContentTypeBadgeProps {
  type: ContentType | string
  className?: string
  variant?: 'default' | 'outline' | 'pill'
}

/**
 * ContentTypeBadge - Displays a badge for content type
 * 
 * This component provides a consistent way to display content types
 * across the application with appropriate styling.
 */
export function ContentTypeBadge({ 
  type, 
  className = '',
  variant = 'default'
}: ContentTypeBadgeProps) {
  // Extended mapping: backend types and UI slugs → labels
  const labelMap: Record<string, string> = {
    // backend
    video: 'Video',
    audio: 'Daina',
    lesson_plan: 'Pamoka',
    game: 'Žaidimas',
    // UI slugs
    dainos: 'Dainos',
    ritminiai_zaidimai: 'Ritminiai žaidimai',
    instrumentai: 'Instrumentai',
    judesio_zaidimai: 'Judesio žaidimai',
    mankstos: 'Mankštos',
    choreografijos: 'Choreografijos',
    pamoku_planai: 'Pamokų planai',
  }

  // Unified tag styling: brand red background with white text, bold
  const colorMap: Record<string, string> = {
    video: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    audio: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    lesson_plan: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    game: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    dainos: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    ritminiai_zaidimai: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    instrumentai: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    judesio_zaidimai: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    mankstos: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    choreografijos: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    pamoku_planai: 'bg-secondary-mint text-white border-secondary-mint font-semibold',
    default: 'bg-secondary-mint text-white border-secondary-mint font-semibold'
  }

  const key = String(type)
  const typeLabel = labelMap[key] || key
  const typeColor = colorMap[key] || colorMap.default

  // Variant styling
  const variantClass = {
    'default': 'rounded-full px-3',
    'outline': 'border rounded-full px-3',
    'pill': 'rounded-full px-3'
  }[variant]
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        typeColor,
        variantClass,
        "font-medium border",
        className
      )}
    >
      {typeLabel}
    </Badge>
  )
} 