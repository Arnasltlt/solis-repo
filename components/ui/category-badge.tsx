'use client'

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/index"
import type { Category } from "@/lib/types/database"

interface CategoryBadgeProps {
  category: Category
  className?: string
  variant?: 'default' | 'outline' | 'pill'
}

/**
 * CategoryBadge - Displays a badge for category
 * 
 * This component provides a consistent way to display categories
 * across the application with appropriate styling.
 */
export function CategoryBadge({ 
  category, 
  className = '',
  variant = 'default'
}: CategoryBadgeProps) {
  // Variant styling
  const variantClass = {
    'default': 'bg-secondary-mint text-white font-semibold',
    'outline': 'bg-transparent border-secondary-mint text-secondary-mint font-semibold',
    'pill': 'bg-secondary-mint text-white rounded-full px-3 font-semibold'
  }[variant];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border rounded-full px-3",
        variantClass,
        className
      )}
    >
      {category.name}
    </Badge>
  )
} 