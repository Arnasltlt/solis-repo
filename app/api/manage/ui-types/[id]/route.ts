import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
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

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return { authorized: false, error: 'Authentication required' }

  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier_id')
    .eq('id', userId)
    .single()

  if (!userRow?.subscription_tier_id) return { authorized: false, error: 'Admin privileges required' }

  const { data: tierRow } = await supabase
    .from('access_tiers')
    .select('name')
    .eq('id', userRow.subscription_tier_id)
    .single()

  if (!tierRow || tierRow.name !== 'administrator') {
    return { authorized: false, error: 'Admin privileges required' }
  }
  return { authorized: true }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAdminAuth()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 403 })
  const { name, slug, is_active } = await request.json().catch(() => ({}))
  if (!name && !slug && typeof is_active !== 'boolean') return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  const admin = createAdminClient()
  const updates: any = {}
  if (name) updates.name = name
  if (slug) updates.slug = slug
  if (typeof is_active === 'boolean') updates.is_active = is_active
  const { data, error } = await admin
    .from('content_ui_types')
    .update(updates)
    .eq('id', params.id)
    .select('id, slug, name, is_active')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAdminAuth()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 403 })
  const admin = createAdminClient()
  // Prevent delete if used
  const { data: used, error: usedError } = await admin
    .from('content_items')
    .select('id')
    .eq('ui_type_id', params.id)
    .limit(1)
  if (usedError) return NextResponse.json({ error: usedError.message }, { status: 500 })
  if (used && used.length > 0) return NextResponse.json({ error: 'Type in use; cannot delete' }, { status: 400 })
  const { error } = await admin
    .from('content_ui_types')
    .delete()
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


