import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const name = searchParams.get('name') || 'download'

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    // Stream the file from the remote URL to the client
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok || !res.body) {
      return NextResponse.json({ error: `Upstream fetch failed with ${res.status}` }, { status: 502 })
    }

    // Try to preserve content type; fallback to octet-stream
    const contentType = res.headers.get('content-type') || 'application/octet-stream'

    // Build response with attachment headers
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}


