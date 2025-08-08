import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  }
  
  console.log('Checking image URL:', url)
  
  try {
    // Check if URL belongs to a Supabase storage bucket
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (supabaseUrl && url.includes(supabaseUrl)) {
      console.log('URL is from Supabase storage')
      
      // Extract the bucket and path from URL
      // Format: https://{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{PATH}
      const publicPrefix = '/storage/v1/object/public/'
      const publicPathStart = url.indexOf(publicPrefix)
      
      if (publicPathStart !== -1) {
        const publicPath = url.substring(publicPathStart + publicPrefix.length)
        const [bucket, ...pathParts] = publicPath.split('/')
        const path = pathParts.join('/')
        
        console.log('Extracted from URL:', { bucket, path })
        
        // Get an admin client to verify object exists
        const adminClient = createAdminClient()
        
        // Try to get object info
        const { data, error } = await adminClient.storage.from(bucket).createSignedUrl(path, 60)
        
        if (error) {
          console.error('Error checking object:', error)
          return NextResponse.json({ 
            exists: false,
            error: `Object error: ${error.message}`,
            details: { bucket, path }
          })
        }
        
        return NextResponse.json({ 
          exists: true,
          signedUrl: data?.signedUrl,
          bucket,
          path,
          info: "If signedUrl is provided, the object exists and is accessible with admin privileges"
        })
      }
    }
    
    // For other URLs, just try to fetch them
    const response = await fetch(url, { method: 'HEAD' })
    
    return NextResponse.json({
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
  } catch (error) {
    console.error('Error checking URL:', error)
    return NextResponse.json({ 
      error: `Failed to check URL: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
} 