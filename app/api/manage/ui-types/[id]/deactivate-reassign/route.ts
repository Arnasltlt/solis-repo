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
  if (!session?.user?.id) return { authorized: false, error: 'Authentication required' }
  return { authorized: true }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAdminAuth()
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: 403 })
  const { reassignToId } = await request.json().catch(() => ({}))
  if (!reassignToId) return NextResponse.json({ error: 'reassignToId is required' }, { status: 400 })
  if (reassignToId === params.id) return NextResponse.json({ error: 'Cannot reassign to the same type' }, { status: 400 })
  const admin = createAdminClient()

  // Ensure target exists and is active
  const { data: target, error: targetError } = await admin
    .from('content_ui_types')
    .select('id')
    .eq('id', reassignToId)
    .eq('is_active', true)
    .single()
  if (targetError || !target) return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })

  // Reassign and deactivate in a best-effort sequence (Supabase lacks server-side tx in REST)
  const { error: reErr } = await admin
    .from('content_items')
    .update({ ui_type_id: reassignToId })
    .eq('ui_type_id', params.id)
  if (reErr) return NextResponse.json({ error: reErr.message }, { status: 500 })

  const { error: deErr } = await admin
    .from('content_ui_types')
    .update({ is_active: false })
    .eq('id', params.id)
  if (deErr) return NextResponse.json({ error: deErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}


