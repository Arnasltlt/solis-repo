import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  }
) 