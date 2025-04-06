import { NextResponse, NextRequest } from 'next/server'
import { uploadThumbnailAdmin, uploadEditorImageAdmin } from '@/lib/services/admin-storage'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to check admin auth
async function checkAdminAuth(request: NextRequest) {
  console.log('API UPLOAD: Starting auth check');
  const cookieStore = cookies();
  
  const authHeader = request.headers.get('Authorization');
  console.log(`API UPLOAD: Received Authorization header: ${authHeader ? 'Bearer ***' : 'none'}`); 

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  let user: any = null;

  // Try cookie auth first
  try {
    console.log('API UPLOAD: Checking cookie auth');
    const { data: { user: cookieUser }, error: cookieAuthError } = await supabase.auth.getUser();
    if (cookieAuthError) {
      console.error('API UPLOAD: Cookie auth error:', cookieAuthError);
    } else if (cookieUser) {
      console.log('API UPLOAD: Found user via cookie', { id: cookieUser.id, role: cookieUser.role });
      user = cookieUser;
    }
  } catch (err) {
    console.error('API UPLOAD: Cookie auth processing error:', err);
  }

  // Try token auth if cookie didn't work
  if (!user && authHeader && authHeader.startsWith('Bearer ')) {
    console.log('API UPLOAD: Cookie auth failed, trying token auth');
    try {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error: tokenAuthError } = await supabase.auth.getUser(token);
      
      if (tokenAuthError) {
         console.error('API UPLOAD: Token auth error:', tokenAuthError);
      } else if (tokenUser) {
        console.log('API UPLOAD: Found user via token', { id: tokenUser.id, role: tokenUser.role });
        user = tokenUser;
      }
    } catch (err) {
      console.error('API UPLOAD: Token processing error:', err);
    }
  }

  // Check if user exists and is admin
  if (!user) {
    console.log('API UPLOAD: No authenticated user found');
    return { authorized: false, error: 'Authentication required', userId: null };
  }
  
  if (user.role !== 'administrator') {
    console.log(`API UPLOAD: User ${user.id} is not admin (role: ${user.role})`);
    return { authorized: false, error: 'Admin privileges required', userId: user.id };
  }

  console.log('API UPLOAD: Auth check passed - user is admin');
  return { authorized: true, error: null, userId: user.id };
}

export async function POST(request: NextRequest) {
  console.log('API UPLOAD: Starting image upload endpoint');
  
  // 1. Check Authorization
  const { authorized, error: authError } = await checkAdminAuth(request);
  
  if (!authorized) {
    return NextResponse.json({ 
      error: authError 
    }, { status: authError === 'Authentication required' ? 401 : 403 });
  }
  
  try {
    // 2. Get the multipart/form-data content from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'editor'; // 'editor' or 'thumbnail'
    
    if (!file || !(file instanceof File)) {
      console.error('API UPLOAD: No file found in request or invalid file');
      return NextResponse.json({ 
        error: 'No file found in request or invalid file type' 
      }, { status: 400 });
    }
    
    console.log('API UPLOAD: Received file', {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadType: type
    });
    
    // 3. Use the appropriate admin upload function based on type
    let result;
    if (type === 'thumbnail') {
      console.log('API UPLOAD: Uploading thumbnail');
      result = await uploadThumbnailAdmin(file);
    } else {
      console.log('API UPLOAD: Uploading editor image');
      result = await uploadEditorImageAdmin(file);
    }
    
    if (result.error) {
      console.error('API UPLOAD: Upload failed:', result.error);
      return NextResponse.json({ 
        error: `Upload failed: ${result.error.message}` 
      }, { status: 500 });
    }
    
    console.log('API UPLOAD: Upload successful:', result.url);
    
    // Verify the URL is accessible
    try {
      console.log('API UPLOAD: Verifying URL is accessible');
      const response = await fetch(result.url, { method: 'HEAD' });
      console.log('API UPLOAD: URL check result:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Extract bucket and path from URL for debugging
      const publicPrefix = '/storage/v1/object/public/';
      const publicPathStart = result.url.indexOf(publicPrefix);
      
      if (publicPathStart !== -1) {
        const publicPath = result.url.substring(publicPathStart + publicPrefix.length);
        const [bucket, ...pathParts] = publicPath.split('/');
        const path = pathParts.join('/');
        console.log('API UPLOAD: Storage path details:', { bucket, path });
      }
    } catch (checkError) {
      console.warn('API UPLOAD: Warning - URL check failed:', checkError);
      // Continue anyway as the upload itself succeeded
    }
    
    return NextResponse.json({
      success: true,
      url: result.url
    });
    
  } catch (error) {
    console.error('API UPLOAD: Unexpected error:', error);
    return NextResponse.json({ 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 