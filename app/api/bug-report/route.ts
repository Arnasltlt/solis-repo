import { NextResponse } from 'next/server'

type BugReportBody = {
  title?: string
  description?: string
}

export async function POST(request: Request) {
  try {
    const { title, description }: BugReportBody = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description' },
        { status: 400 }
      )
    }

    const owner = process.env.GITHUB_REPO_OWNER
    const repo = process.env.GITHUB_REPO_NAME
    const token = process.env.GITHUB_DISPATCH_TOKEN

    if (!owner || !repo || !token) {
      return NextResponse.json(
        {
          error:
            'Server is not configured. Please set GITHUB_REPO_OWNER, GITHUB_REPO_NAME, and GITHUB_DISPATCH_TOKEN env vars.',
        },
        { status: 500 }
      )
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'website-bug-report',
        client_payload: { title, description },
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'GitHub dispatch failed', status: res.status, details: text },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error', details: (error as Error).message },
      { status: 500 }
    )
  }
}


