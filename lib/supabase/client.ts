import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

// Get environment variables with development fallbacks
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// In production, validate and warn about missing environment variables
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing critical environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing critical environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
} else {
  // In development, just log a warning
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Missing Supabase environment variables. Check your .env file.')
  }
}

// Create the client with the variables (real or placeholder)
export const supabase = createBrowserClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
) 