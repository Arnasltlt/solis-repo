'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { validateStorageUrl } from '@/lib/utils/index'

interface ContentImageProps {
  src: string | null
  alt: string
  priority?: boolean
  className?: string
  aspectRatio?: 'video' | 'square' | 'auto'
  fill?: boolean
  width?: number
  height?: number
}

/**
 * ContentImage - Reusable image component with error handling
 * 
 * This component:
 * - Validates image URLs
 * - Handles loading and error states
 * - Provides consistent fallback for broken images
 * - Optimizes images using Next.js Image component
 */
export function ContentImage({
  src,
  alt,
  priority = false,
  className = '',
  aspectRatio = 'video',
  fill = true,
  width,
  height
}: ContentImageProps) {
  const [imageError, setImageError] = useState(false)
  const [validatedSrc, setValidatedSrc] = useState<string | null>(null)
  
  // Log initial props for debugging
  useEffect(() => {
    console.log('ContentImage: Initial props', { 
      src, 
      alt, 
      aspectRatio,
      fill,
      width,
      height
    });
  }, [src, alt, aspectRatio, fill, width, height]);
  
  // Validate the image URL
  useEffect(() => {
    console.log('ContentImage: Validating src:', src);
    const validUrl = validateStorageUrl(src)
    console.log('ContentImage: Validation result:', validUrl);
    setValidatedSrc(validUrl)
    setImageError(!validUrl)
  }, [src])
  
  // Handle image loading error
  const handleError = () => {
    console.error(`ContentImage: Failed to load image: ${src}`)
    setImageError(true)
  }
  
  // Determine aspect ratio class
  const aspectRatioClass = {
    'video': 'aspect-video',
    'square': 'aspect-square',
    'auto': ''
  }[aspectRatio]
  
  // If image is invalid or has error, show placeholder
  if (!validatedSrc || imageError) {
    console.log('ContentImage: Showing placeholder due to', 
      !validatedSrc ? 'invalid URL' : 'loading error');
    
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${aspectRatioClass} ${className}`}>
        <span className="text-gray-400 text-sm">
          {imageError ? 'Failed to load image' : 'No image available'}
        </span>
      </div>
    )
  }
  
  // Render the image
  console.log('ContentImage: Rendering image with src:', validatedSrc);
  
  return fill ? (
    <div className={`relative overflow-hidden ${aspectRatioClass} ${className}`}>
      <Image
        src={validatedSrc}
        alt={alt}
        fill
        className="object-cover"
        onError={handleError}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  ) : (
    <Image
      src={validatedSrc}
      alt={alt}
      width={width || 400}
      height={height || 225}
      className={`object-cover ${className}`}
      onError={handleError}
      priority={priority}
    />
  )
} 