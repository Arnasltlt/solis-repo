'use client'

import { cn } from "@/lib/utils/index"

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullPage?: boolean
}

/**
 * LoadingState - Reusable loading component
 * 
 * This component provides consistent loading states across the application:
 * - spinner: Animated spinner (default)
 * - skeleton: Placeholder skeleton
 * - dots: Animated dots
 * 
 * Can be used inline or as a full-page loading indicator.
 */
export function LoadingState({ 
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
  fullPage = false
}: LoadingStateProps) {
  // Size mapping
  const sizeClass = {
    'sm': 'h-4 w-4',
    'md': 'h-8 w-8',
    'lg': 'h-12 w-12'
  }[size];
  
  // Container class based on fullPage prop
  const containerClass = fullPage 
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center';
  
  // Render the appropriate loading variant
  const renderLoading = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={cn(
            "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
            sizeClass,
            className
          )} />
        );
      
      case 'skeleton':
        return (
          <div className={cn(
            "animate-pulse bg-muted rounded-md",
            className || 'h-32 w-full'
          )} />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-current animate-bounce",
                  sizeClass.replace('w-', 'w-2 ').replace('h-', 'h-2 '),
                  `animation-delay-${i * 100}`
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
    }
  };
  
  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-4">
        {renderLoading()}
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

/**
 * ContentSkeleton - Skeleton loader specifically for content items
 */
export function ContentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border shadow-sm">
          <div className="aspect-video bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-full" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          </div>
          <div className="px-4 py-3 bg-muted/20 flex">
            <div className="h-6 bg-muted rounded animate-pulse w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ContentDetailSkeleton - Skeleton loader for content detail page
 */
export function ContentDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse w-3/4" />
        <div className="aspect-video bg-muted rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-5 bg-muted rounded animate-pulse w-40" />
          <div className="h-5 bg-muted rounded animate-pulse w-32" />
        </div>
      </div>
      
      <div className="bg-muted/20 rounded-lg p-6 animate-pulse h-64" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded animate-pulse w-32" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded animate-pulse w-40" />
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded-full animate-pulse w-20" />
                <div className="h-8 bg-muted rounded-full animate-pulse w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded animate-pulse w-32" />
              <div className="flex gap-2">
                <div className="h-8 bg-muted rounded-full animate-pulse w-24" />
                <div className="h-8 bg-muted rounded-full animate-pulse w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 