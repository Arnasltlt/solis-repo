import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.')
}

// Initialize Supabase client with options for better error handling
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      // Add error handling and retry logic
      fetch: (...args) => {
        return fetch(...args)
      },
    },
    // Add more robust error logging for DB queries
    db: {
      schema: 'public',
    },
  }
)

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

// Helper to get a client for a specific use case
// This allows us to use different clients for different purposes
export function getSupabaseClient() {
  // We can add more error handling, logging, or config here if needed
  if (!isSupabaseConfigured()) {
    console.warn('Using Supabase client with missing environment variables')
  }
  return supabase
}

// Export a default client getter
export default function getClient() {
  return getSupabaseClient()
} 