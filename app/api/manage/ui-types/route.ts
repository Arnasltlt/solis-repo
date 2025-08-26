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

export async function GET() {
  const auth = await checkAdminAuth()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 403 })

  const admin = createAdminClient()
  // Fetch all UI types
  const { data: types, error: typesError } = await admin
    .from('content_ui_types')
    .select('id, slug, name, is_active')
    .order('name')

  if (typesError) return NextResponse.json({ error: typesError.message }, { status: 500 })

  // Fetch counts per type
  const { data: counts, error: countError } = await admin
    .from('content_items')
    .select('ui_type_id, count:ui_type_id', { count: 'exact', head: true })

  // counts via head:true returns count across all; we need per-group. Use RPC-like manual aggregate.
  const { data: grouped, error: groupError } = await admin
    .from('content_items')
    .select('ui_type_id')

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 })

  const map: Record<string, number> = {}
  for (const row of grouped || []) {
    const id = (row as any).ui_type_id as string
    map[id] = (map[id] || 0) + 1
  }

  const result = (types || []).map(t => ({ ...t, content_count: map[t.id] || 0 }))
  return NextResponse.json({ items: result })
}

export async function POST(request: NextRequest) {
  const auth = await checkAdminAuth()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 403 })

  const { name, slug, is_active } = await request.json().catch(() => ({}))
  if (!name || !slug) return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_ui_types')
    .insert({ name, slug, is_active: is_active ?? true })
    .select('id, slug, name, is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}


