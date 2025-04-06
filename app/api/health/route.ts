import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Health check endpoint to verify application status
 * Useful for monitoring services and deployment verification
 */
export async function GET() {
  const start = Date.now()
  let dbStatus = 'unknown'
  
  try {
    // Use direct client creation instead of cookies for static generation
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Simple query to check database connectivity
    const { data, error } = await supabase
      .from('access_tiers')
      .select('count(*)', { count: 'exact', head: true })
    
    dbStatus = error ? 'error' : 'ok'
  } catch (error) {
    console.error('Database health check failed:', error)
    dbStatus = 'error'
  }
  
  // Calculate response time
  const responseTime = Date.now() - start
  
  // Basic environment check
  const envCheck = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    site_url: !!process.env.NEXT_PUBLIC_SITE_URL,
    node_env: process.env.NODE_ENV || 'development'
  }
  
  return NextResponse.json({
    status: 'ok',
    database: dbStatus,
    environment: envCheck.node_env,
    timestamp: new Date().toISOString(),
    response_time_ms: responseTime,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  })
}