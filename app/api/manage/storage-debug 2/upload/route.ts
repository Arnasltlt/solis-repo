import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Create a test image as a Blob (a 1x1 pixel transparent PNG)
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const binaryData = Buffer.from(base64Data, 'base64');
    const file = new File([binaryData], 'test-image.png', { type: 'image/png' });
    
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    console.log('Using admin client to upload test image');
    
    // Try uploading to thumbnails bucket
    console.log('Attempting to upload to thumbnails bucket...');
    const fileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('thumbnails')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload test image',
        details: uploadError
      }, { status: 500 });
    }
    
    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('thumbnails')
      .getPublicUrl(uploadData.path);
    
    return NextResponse.json({
      success: true,
      message: 'Test image uploaded successfully',
      file: {
        path: uploadData.path,
        publicUrl: urlData.publicUrl
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 