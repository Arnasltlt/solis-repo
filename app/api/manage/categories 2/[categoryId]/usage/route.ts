import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin' // Admin client for DB ops
// Use the SSR helper - recommended for App Router
import { createRouteHandlerClient } from '@supabase/ssr' 
import { cookies } from 'next/headers'
import { getCategoryUsageOnServer } from '@/lib/services/categories'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest, 
  { params }: { params: { categoryId: string } }
) {
  const categoryId = params.categoryId
  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
  }

  // 1. Create client using the SSR helper
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  // 2. Check if the user is authenticated and get user data
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('API /usage: Checking auth. User:', user);
  console.log('API /usage: Auth Error:', authError);
  
  if (authError || !user) {
    console.error('API /usage: Authentication failed.', authError);
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 3. Check if the authenticated user is an administrator directly from user object metadata
  // Supabase typically stores custom roles in user_metadata or app_metadata
  // Adjust 'user_metadata' if you store the role elsewhere (e.g., app_metadata)
  const userRole = user.user_metadata?.role; 
  console.log('API /usage: User role from metadata:', userRole);

  if (userRole !== 'administrator') {
    console.error(`API /usage: Admin check failed. User role is '${userRole}', not 'administrator'.`);
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  // 4. User is authenticated and is an admin, proceed with the operation
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