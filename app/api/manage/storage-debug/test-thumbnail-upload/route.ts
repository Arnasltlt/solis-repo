import { NextResponse, NextRequest } from 'next/server'
import { uploadThumbnailAdmin } from '@/lib/services/admin-storage'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }
  console.log('TEST-THUMBNAIL: Starting test thumbnail upload');

  try {
    // Get the multipart/form-data content from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file || !(file instanceof File)) {
      console.error('TEST-THUMBNAIL: No file found in request or invalid file');
      return NextResponse.json({ 
        error: 'No file found in request or invalid file type' 
      }, { status: 400 });
    }
    
    console.log('TEST-THUMBNAIL: Received file', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Use our admin thumbnail upload function
    console.log('TEST-THUMBNAIL: Calling uploadThumbnailAdmin');
    const result = await uploadThumbnailAdmin(file);
    
    if (result.error) {
      console.error('TEST-THUMBNAIL: Upload failed:', result.error);
      return NextResponse.json({ 
        error: `Upload failed: ${result.error.message}` 
      }, { status: 500 });
    }
    
    console.log('TEST-THUMBNAIL: Upload successful', result);
    
    return NextResponse.json({
      success: true,
      message: 'Test upload successful',
      url: result.url
    });
    
  } catch (error) {
    console.error('TEST-THUMBNAIL: Unexpected error:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 