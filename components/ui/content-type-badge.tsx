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

  const colorMap: Record<string, string> = {
    // backend
    video: 'bg-blue-50 text-blue-700 border-blue-200',
    audio: 'bg-purple-50 text-purple-700 border-purple-200',
    lesson_plan: 'bg-green-50 text-green-700 border-green-200',
    game: 'bg-orange-50 text-orange-700 border-orange-200',
    // UI slugs
    dainos: 'bg-purple-50 text-purple-700 border-purple-200',
    ritminiai_zaidimai: 'bg-orange-50 text-orange-700 border-orange-200',
    instrumentai: 'bg-green-50 text-green-700 border-green-200',
    judesio_zaidimai: 'bg-orange-50 text-orange-700 border-orange-200',
    mankstos: 'bg-blue-50 text-blue-700 border-blue-200',
    choreografijos: 'bg-rose-50 text-rose-700 border-rose-200',
    pamoku_planai: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    default: 'bg-yellow-50 text-black border-yellow-200'
  }

  const key = String(type)
  const typeLabel = labelMap[key] || key
  const typeColor = colorMap[key] || colorMap.default

  // Variant styling
  const variantClass = {
    'default': '',
    'outline': 'bg-transparent border',
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