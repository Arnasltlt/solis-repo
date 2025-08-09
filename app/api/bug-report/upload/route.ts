import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type UploadBody = {
  dataUrl?: string
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  const [meta, base64] = dataUrl.split(',')
  const match = /data:(.*?);base64/.exec(meta || '')
  const mime = match?.[1] || 'image/jpeg'
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: mime })
  return { blob, mime }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server is not configured for uploads' }, { status: 500 })
    }
    const { dataUrl }: UploadBody = await request.json()
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const admin = createAdminClient()
    const ts = Date.now()
    const fileName = `bug-reports/${ts}.jpg`
    const { blob, mime } = dataUrlToBlob(dataUrl)

    const { data, error } = await admin.storage.from('documents').upload(fileName, blob, {
      upsert: true,
      cacheControl: '3600',
      contentType: mime,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const { data: urlData } = admin.storage.from('documents').getPublicUrl(data.path)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}


