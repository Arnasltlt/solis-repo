import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { insertSampleContent } from '@/lib/services/content'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Export the POST handler
export const POST = async () => {
  try {
    // Insert sample content using admin client
    const contentItems = await insertSampleContent(supabaseAdmin)
    return NextResponse.json({ success: true, data: contentItems })
  } catch (error) {
    console.error('Error inserting sample content:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
} 