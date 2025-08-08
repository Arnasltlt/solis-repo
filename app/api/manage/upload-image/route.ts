import { NextResponse, NextRequest } from 'next/server'
import { uploadThumbnailAdmin, uploadEditorImageAdmin, uploadAttachmentAdmin } from '@/lib/services/admin-storage'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to check admin auth (session + DB tier check)
async function checkAdminAuth() {
  const cookieStore = cookies();

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
    const { data: { user: cookieUser } } = await supabase.auth.getUser();
    if (cookieUser) {
      user = cookieUser;
    }
  } catch {}

  // Check if user exists and is admin via users/access_tiers
  if (!user) {
    return { authorized: false, error: 'Authentication required', userId: null };
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier_id')
    .eq('id', user.id)
    .single();

  if (!userRow?.subscription_tier_id) {
    return { authorized: false, error: 'Admin privileges required', userId: user.id };
  }

  const { data: tierRow } = await supabase
    .from('access_tiers')
    .select('name')
    .eq('id', userRow.subscription_tier_id)
    .single();

  if (!tierRow || tierRow.name !== 'administrator') {
    return { authorized: false, error: 'Admin privileges required', userId: user.id };
  }

  return { authorized: true, error: null, userId: user.id };
}

export async function POST(request: NextRequest) {
  // 1. Check Authorization
  const { authorized, error: authError } = await checkAdminAuth();
  
  if (!authorized) {
    return NextResponse.json({ 
      error: authError 
    }, { status: authError === 'Authentication required' ? 401 : 403 });
  }
  
  try {
    // 2. Get the multipart/form-data content from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'editor'; // 'editor', 'thumbnail', or 'attachment'
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file found in request or invalid file type' }, { status: 400 });
    }
    
    // 3. Use the appropriate admin upload function based on type
    let result;
    if (type === 'thumbnail') {
      result = await uploadThumbnailAdmin(file);
    } else if (type === 'attachment') {
      result = await uploadAttachmentAdmin(file);
      
      if (!result.error) {
        // For attachments, return additional metadata
        return NextResponse.json({
          success: true,
          url: result.url,
          fileName: result.fileName,
          fileSize: result.fileSize,
          fileType: result.fileType
        });
      }
    } else {
      result = await uploadEditorImageAdmin(file);
    }
    
    if (result.error) {
      return NextResponse.json({ error: `Upload failed: ${result.error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      url: result.url
    });
    
  } catch (error) {
    return NextResponse.json({ error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
} 