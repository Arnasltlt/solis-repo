import { NextResponse } from 'next/server'

/**
 * Admin-only API route to check environment variables
 * This helps confirm that all required environment variables are set in production
 * Only returns the presence (not the actual values) of sensitive environment variables
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  try {
    // Check if the requester is an admin
    // In a production environment, you would authenticate this properly
    
    // Create an environment status check object
    const envStatus = {
      supabase: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      site: {
        url: process.env.NEXT_PUBLIC_SITE_URL || null,
        environment: process.env.NODE_ENV || 'development',
      },
      paysera: {
        projectId: !!process.env.PAYSERA_PROJECT_ID,
        password: !!process.env.PAYSERA_PASSWORD,
        testMode: process.env.PAYSERA_TEST_MODE === 'true',
      }
    }

    return NextResponse.json({
      status: 'ok',
      environment: envStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in environment check API:', error)
    return NextResponse.json(
      {
        error: 'Failed to check environment variables',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}