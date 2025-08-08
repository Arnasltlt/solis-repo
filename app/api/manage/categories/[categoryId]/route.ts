import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
// Use the correct SSR helper for Route Handlers: createServerClient
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateCategoryOnServer, deleteCategoryOnServer } from '@/lib/services/categories'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Common function to get Supabase client and check admin auth for this route
async function getSupabaseAndCheckAdmin() {
  const cookieStore = cookies()
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
        },
      },
    }
  )

  // Require an authenticated session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    return { authorized: false, error: 'Authentication required', supabase }
  }

  // Check admin via application users table and access tier name
  const userId = session.user.id
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('subscription_tier_id')
    .eq('id', userId)
    .single()

  if (userErr || !userRow?.subscription_tier_id) {
    return { authorized: false, error: 'Failed to verify user tier', supabase }
  }

  const { data: tierRow, error: tierErr } = await supabase
    .from('access_tiers')
    .select('name')
    .eq('id', userRow.subscription_tier_id)
    .single()

  if (tierErr || !tierRow || tierRow.name !== 'administrator') {
    return { authorized: false, error: 'Admin privileges required', supabase }
  }

  return { authorized: true, error: null, supabase }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const categoryId = params.categoryId
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
  }

  const { authorized, error, supabase } = await getSupabaseAndCheckAdmin()
  if (!authorized) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const updateData = await request.json()
    
    if (!updateData?.name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    try {
      const { data, error } = await updateCategoryOnServer(
        supabaseAdmin,
        categoryId,
        updateData.name.trim()
      )

      if (error) {
        console.error("Error updating category:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } catch (err) {
      console.error("Server error updating category:", err)
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error("Error processing request:", err)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const categoryId = params.categoryId
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
  }

  const { authorized, error, supabase } = await getSupabaseAndCheckAdmin()
  if (!authorized) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 })
  }

  const supabaseAdmin = createAdminClient()
  try {
    const { success, error } = await deleteCategoryOnServer(
      supabaseAdmin,
      categoryId
    )

    if (error) {
      console.error("Error deleting category:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Category deleted successfully'
    })
  } catch (err) {
    console.error("Server error deleting category:", err)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 