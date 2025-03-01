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
    'default': 'bg-gray-900 text-white',
    'outline': 'bg-transparent border-gray-900 text-gray-900',
    'pill': 'bg-gray-900 text-white rounded-full px-3'
  }[variant];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border border-gray-900",
        variantClass,
        className
      )}
    >
      {category.name}
    </Badge>
  )
} 