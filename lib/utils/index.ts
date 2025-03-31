import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Remove the re-export since the root utils.ts file no longer exists
// export * from '../utils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates and formats a Supabase storage URL
 * @param url The URL to validate and format
 * @returns The formatted URL or null if invalid
 */
export function validateStorageUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  
  try {
    // Check if it's a valid URL
    new URL(url);
    
    // Check if it's a placeholder URL (which is valid)
    if (url.includes('placehold.co')) {
      return url;
    }
    
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co') || url.includes('supabase.in')) {
      return url;
    }
    
    // If it's a relative URL, it might be valid too
    if (url.startsWith('/')) {
      return url;
    }
    
    // If it's an absolute URL to a known image hosting service, it's valid
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
        url.includes('cloudinary.com') || 
        url.includes('imgur.com')) {
      return url;
    }
    
    return url; // Return the URL anyway, let the image component handle errors
  } catch (error) {
    console.error('Invalid URL format:', url);
    return null;
  }
}

/**
 * Gets the file extension from a filename or path
 * @param filename The filename or path
 * @returns The file extension (without the dot) or empty string if none
 */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Utility function to safely check if code is running in a browser environment
 * Useful for avoiding window/document references in server-side rendering
 */
export const isBrowser = () => typeof window !== 'undefined' 