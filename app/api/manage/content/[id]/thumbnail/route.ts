import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to check admin auth (similar to content route)
async function checkAdminAuth(request: NextRequest) {
  console.log('API UPDATE THUMBNAIL: Starting auth check');
  const cookieStore = cookies();
  
  const authHeader = request.headers.get('Authorization');
  console.log(`API UPDATE THUMBNAIL: Received Authorization header: ${authHeader ? 'Bearer ***' : 'none'}`); 

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
  
  // Try cookie auth first
  let userId = null;
  try {
    const { data, error: cookieAuthError } = await supabase.auth.getUser();
    
    if (cookieAuthError) {
      console.error('API UPDATE THUMBNAIL: Cookie auth error:', cookieAuthError);
    } else if (data?.user) {
      console.log('API UPDATE THUMBNAIL: Found user via cookie', { id: data.user.id });
      userId = data.user.id;
    }
  } catch (err) {
    console.error('API UPDATE THUMBNAIL: Cookie auth processing error:', err);
  }
  
  // If no user from cookie, try token auth
  if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const { data, error: tokenError } = await supabase.auth.getUser(token);
      
      if (tokenError) {
        console.error('API UPDATE THUMBNAIL: Token auth error:', tokenError);
      } else if (data?.user) {
        console.log('API UPDATE THUMBNAIL: Found user via token', { id: data.user.id });
        userId = data.user.id;
      }
    } catch (err) {
      console.error('API UPDATE THUMBNAIL: Token processing error:', err);
    }
  }
  
  if (!userId) {
    return { authorized: false, error: 'Authentication required', userId: null };
  }
  
  // We're in development mode, so assume the user is an admin
  if (process.env.NODE_ENV === 'development') {
    console.log('API UPDATE THUMBNAIL: DEV mode - treating user as admin');
    return { authorized: true, error: null, userId };
  }
  
  // In production, we should verify admin status
  // For now, just accept any authenticated user
  console.log('API UPDATE THUMBNAIL: Auth check passed - authenticated user');
  return { authorized: true, error: null, userId };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validate the ID parameter
  const contentId = params.id;
  if (!contentId) {
    return NextResponse.json({ error: 'Missing content ID' }, { status: 400 });
  }

  // 2. Check Authorization
  const { authorized, error: authError, userId } = await checkAdminAuth(request);
  
  if (!authorized) {
    return NextResponse.json({ error: authError }, { status: authError === 'Authentication required' ? 401 : 403 });
  }

  // 3. Parse and Validate Request Body
  let thumbnailUrl: string;
  try {
    const requestBody = await request.json();
    
    if (!requestBody.thumbnail_url) {
      return NextResponse.json({ error: 'Missing thumbnail_url in request' }, { status: 400 });
    }
    
    thumbnailUrl = requestBody.thumbnail_url;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 4. Update the content using Admin Client to bypass permissions
  const supabaseAdmin = createAdminClient();
  try {
    console.log(`API UPDATE THUMBNAIL: Updating thumbnail for content ID ${contentId} to ${thumbnailUrl}`);
    
    const { error: updateError } = await supabaseAdmin
      .from('content_items')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', contentId);

    if (updateError) {
      console.error('API UPDATE THUMBNAIL: Update error:', updateError);
      return NextResponse.json({ error: `Failed to update thumbnail: ${updateError.message}` }, { status: 500 });
    }

    // 5. Return success
    return NextResponse.json({ 
      message: 'Thumbnail updated successfully',
      contentId: contentId,
      thumbnailUrl: thumbnailUrl
    }, { status: 200 });
  } catch (error: any) {
    console.error('API UPDATE THUMBNAIL: Unexpected error:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
} 