import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin' // Admin client for DB ops
// Use the correct SSR helper for Route Handlers: createServerClient
import { createServerClient, type CookieOptions } from '@supabase/ssr' 
import { cookies } from 'next/headers'
import { getCategoryUsageOnServer } from '@/lib/services/categories'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  if (process.env.NODE_ENV !== 'development') {
    // Hide debug endpoint in production
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  const cookieStore = cookies();
  
  const categoryId = params.categoryId
  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
  }

  // Create Supabase client
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      },
    }
  )

  // Verify admin via DB (tier-based), not JWT role
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin', { uid: userId })
  if (adminError || !isAdminResult) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const supabaseAdmin = createAdminClient()
  const { count, error: usageError } = await getCategoryUsageOnServer(supabaseAdmin, categoryId)
  if (usageError) {
    return NextResponse.json({ error: usageError.message || 'Failed to get usage count' }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
} 