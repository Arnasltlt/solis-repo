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
    console.log('validateStorageUrl: URL is null or undefined');
    return null;
  }
  
  // Log the URL for debugging
  console.log('validateStorageUrl: Validating URL:', url);
  
  try {
    // Check if it's a valid URL
    new URL(url);
    
    // Check if it's a placeholder URL (which is valid)
    if (url.includes('placehold.co')) {
      console.log('validateStorageUrl: Using placeholder image');
      return url;
    }
    
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co') || url.includes('supabase.in')) {
      console.log('validateStorageUrl: Valid Supabase storage URL');
      return url;
    }
    
    // If it's a relative URL, it might be valid too
    if (url.startsWith('/')) {
      console.log('validateStorageUrl: Valid relative URL');
      return url;
    }
    
    // If it's an absolute URL to a known image hosting service, it's valid
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
        url.includes('cloudinary.com') || 
        url.includes('imgur.com')) {
      console.log('validateStorageUrl: Valid image URL');
      return url;
    }
    
    console.log('validateStorageUrl: URL format is valid but not recognized as an image URL:', url);
    return url; // Return the URL anyway, let the image component handle errors
  } catch (error) {
    console.error('validateStorageUrl: Invalid URL format:', url, error);
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