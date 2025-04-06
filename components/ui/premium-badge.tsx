'use client'

import { Badge } from "@/components/ui/badge"
import { SparklesIcon } from "@heroicons/react/24/solid"
import { cn } from "@/lib/utils/index"

interface PremiumBadgeProps {
  className?: string
  variant?: 'badge' | 'pill' | 'banner' | 'icon'
  showLabel?: boolean
}

/**
 * PremiumBadge - Displays a badge for premium content
 * 
 * This component provides a consistent way to display premium content
 * indicators across the application with appropriate styling.
 */
export function PremiumBadge({ 
  className = '',
  variant = 'badge',
  showLabel = true
}: PremiumBadgeProps) {
  // Variant styling
  const variantStyles = {
    'badge': "bg-yellow-500 text-black",
    'pill': "bg-yellow-500 text-black rounded-full px-3",
    'banner': "w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2",
    'icon': "bg-transparent p-0"
  }[variant];
  
  return variant === 'banner' ? (
    <div className={cn(
      "flex items-center gap-2 font-medium",
      variantStyles,
      className
    )}>
      <SparklesIcon className="w-5 h-5" />
      {showLabel && <span>Narystės turinys</span>}
    </div>
  ) : (
    <Badge 
      variant="outline" 
      className={cn(
        "border-transparent font-medium",
        variantStyles,
        className
      )}
    >
      <SparklesIcon className="w-4 h-4 mr-1" />
      {showLabel && "Narystė"}
    </Badge>
  )
} 