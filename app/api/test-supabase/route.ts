import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  // Create a Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Test the connection by fetching age groups
    const { data, error } = await supabase
      .from('age_groups')
      .select('*')
      .limit(5)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Supabase connection successful'
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to Supabase'
    }, { status: 500 })
  }
} 