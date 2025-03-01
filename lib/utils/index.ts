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
  if (!url) return null;
  
  try {
    // Check if it's a valid URL
    new URL(url);
    return url;
  } catch (error) {
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