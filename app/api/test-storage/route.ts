import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database'

const THUMBNAILS_BUCKET = 'thumbnails'

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Log file details
    console.log('API received file:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      return NextResponse.json(
        { error: `Failed to list buckets: ${bucketsError.message}` },
        { status: 500 }
      )
    }
    
    const bucketExists = buckets.some(b => b.name === THUMBNAILS_BUCKET)
    if (!bucketExists) {
      return NextResponse.json(
        { error: `Bucket '${THUMBNAILS_BUCKET}' does not exist` },
        { status: 500 }
      )
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `api-test-${Date.now()}.${fileExt}`
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(THUMBNAILS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(THUMBNAILS_BUCKET)
      .getPublicUrl(data.path)
    
    // Return success response
    return NextResponse.json({
      success: true,
      path: data.path,
      url: publicUrl
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      return NextResponse.json(
        { error: `Failed to list buckets: ${bucketsError.message}` },
        { status: 500 }
      )
    }
    
    // List files in thumbnails bucket
    let files: any[] = []
    if (buckets.some(b => b.name === THUMBNAILS_BUCKET)) {
      const { data: fileList, error: listError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .list()
      
      if (listError) {
        return NextResponse.json(
          { error: `Failed to list files: ${listError.message}` },
          { status: 500 }
        )
      }
      
      files = fileList || []
    }
    
    // Return storage info
    return NextResponse.json({
      buckets,
      thumbnailFiles: files,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 