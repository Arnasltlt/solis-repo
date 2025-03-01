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
  // Type label mapping
  const typeLabel = {
    'video': 'Video',
    'audio': 'Daina',
    'lesson_plan': 'Pamoka',
    'game': 'Žaidimas'
  }[type as ContentType] || type;
  
  // Type color mapping
  const typeColor = {
    'video': 'bg-blue-50 text-blue-700 border-blue-200',
    'audio': 'bg-purple-50 text-purple-700 border-purple-200',
    'lesson_plan': 'bg-green-50 text-green-700 border-green-200',
    'game': 'bg-orange-50 text-orange-700 border-orange-200',
    'default': 'bg-yellow-50 text-black border-yellow-200'
  }[type as ContentType] || 'bg-yellow-50 text-black border-yellow-200';
  
  // Variant styling
  const variantClass = {
    'default': '',
    'outline': 'bg-transparent border',
    'pill': 'rounded-full px-3'
  }[variant];
  
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