import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { insertSampleContent } from '@/lib/services/content'

// Export the POST handler
export const POST = async () => {
  try {
    // Insert sample content using regular client
    const contentItems = await insertSampleContent()
    return NextResponse.json({ success: true, data: contentItems })
  } catch (error) {
    console.error('Error inserting sample content:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
} 