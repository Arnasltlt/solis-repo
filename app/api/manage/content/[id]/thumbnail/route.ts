import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Strict admin check based on session and users/access_tiers
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

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { authorized: false, error: 'Authentication required' };
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier_id')
    .eq('id', userId)
    .single();

  if (!userRow?.subscription_tier_id) {
    return { authorized: false, error: 'Admin privileges required' };
  }

  const { data: tierRow } = await supabase
    .from('access_tiers')
    .select('name')
    .eq('id', userRow.subscription_tier_id)
    .single();

  if (!tierRow || tierRow.name !== 'administrator') {
    return { authorized: false, error: 'Admin privileges required' };
  }

  return { authorized: true, error: null };
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
  const { authorized, error: authError } = await checkAdminAuth();
  
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

  // 4. Update the content using Admin Client to bypass RLS (trusted path)
  const supabaseAdmin = createAdminClient();
  try {
    const { error: updateError } = await supabaseAdmin
      .from('content_items')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', contentId);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update thumbnail: ${updateError.message}` }, { status: 500 });
    }

    // 5. Return success
    return NextResponse.json({ 
      message: 'Thumbnail updated successfully',
      contentId: contentId,
      thumbnailUrl: thumbnailUrl
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
} 