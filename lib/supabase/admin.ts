import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Create a Supabase admin client with the service role key
 * IMPORTANT: This should only be used in server-side contexts!
 * This bypasses Row Level Security (RLS) - use with caution
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables for admin operations')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey)
} 