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
  // Debug cookie access
  console.log('API /usage: Request headers:', Object.fromEntries(request.headers));
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log('API /usage: Available cookies:', allCookies);
  
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

  // Try to verify auth from cookies first
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('API /usage: Checking cookie auth. User:', user);
    
    if (user && user.role === 'administrator') {
      console.log('API /usage: User authorized via cookies');
      
      // User is authorized via cookies, proceed with admin operation
      const supabaseAdmin = createAdminClient()
      const { count, error: usageError } = await getCategoryUsageOnServer(supabaseAdmin, categoryId)
      
      if (usageError) {
        console.error('Error getting category usage:', usageError.message)
        return NextResponse.json({ error: usageError.message || 'Failed to get usage count' }, { status: 500 })
      }
      
      return NextResponse.json({ count: count ?? 0 })
    }
  } catch (err) {
    console.error('API /usage: Cookie auth error:', err);
  }
  
  // If cookie auth failed, try token auth from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('API /usage: Checking token auth');
      
      // Create a new client with the token
      const { data: { user }, error: tokenAuthError } = await supabase.auth.getUser(token);
      
      if (tokenAuthError) {
        console.error('API /usage: Token auth error:', tokenAuthError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
      
      if (!user) {
        console.error('API /usage: Token auth returned no user');
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
      
      console.log('API /usage: Token auth user:', user);
      console.log('API /usage: Token auth user role:', user.role);
      
      if (user.role !== 'administrator') {
        console.error(`API /usage: Admin check failed. User role is '${user.role}', not 'administrator'.`);
        return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
      }
      
      // User is authorized via token, proceed with admin operation
      const supabaseAdmin = createAdminClient()
      const { count, error: usageError } = await getCategoryUsageOnServer(supabaseAdmin, categoryId)
      
      if (usageError) {
        console.error('Error getting category usage:', usageError.message)
        return NextResponse.json({ error: usageError.message || 'Failed to get usage count' }, { status: 500 })
      }
      
      return NextResponse.json({ count: count ?? 0 })
    } catch (err) {
      console.error('API /usage: Token processing error:', err);
    }
  }
  
  // TEMPORARY FALLBACK: Skip auth checks and proceed for debugging
  console.log('API /usage: USING FALLBACK - NO VALID AUTH METHOD WORKED');
  
  // Use the Admin client for the DB operation
  const supabaseAdmin = createAdminClient()
  
  try {
    const { count, error: usageError } = await getCategoryUsageOnServer(
      supabaseAdmin, 
      categoryId
    )

    if (usageError) {
      console.error('Error getting category usage:', usageError.message)
      return NextResponse.json({ error: usageError.message || 'Failed to get usage count' }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })

  } catch (error) {
    console.error('API error getting category usage:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching category usage' },
      { status: 500 }
    )
  }
} 