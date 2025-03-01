'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/index"
import type { AgeGroup } from "@/lib/types/database"

interface AgeGroupBadgeProps {
  ageGroup: AgeGroup
  className?: string
  variant?: 'default' | 'outline' | 'pill'
}

/**
 * AgeGroupBadge - Displays a badge for age group
 * 
 * This component provides a consistent way to display age groups
 * across the application with appropriate styling.
 */
export function AgeGroupBadge({ 
  ageGroup, 
  className = '',
  variant = 'default'
}: AgeGroupBadgeProps) {
  // Variant styling
  const variantClass = {
    'default': 'bg-yellow-100 text-black',
    'outline': 'bg-transparent border-yellow-200 text-black',
    'pill': 'bg-yellow-100 text-black rounded-full px-3'
  }[variant];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border border-yellow-200",
        variantClass,
        className
      )}
    >
      {ageGroup.range}
    </Badge>
  )
} 