import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import { randomUUID } from 'crypto'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Define expected request body type
type CreateContentRequestBody = {
  title: string;
  description: string;
  type: 'video' | 'audio' | 'lesson_plan' | 'game';
  published: boolean;
  accessTierId: string;
  ageGroups: string[]; // Array of age group IDs
  categories: string[]; // Array of category IDs
  // thumbnail data might be handled separately later or passed as base64/formdata
}

// Helper function to check admin auth (prioritize token)
async function checkAdminAuth(request: NextRequest) {
  console.log('API POST content: Starting auth check (cookie first)');
  const cookieStore = cookies();
  
  // --- ADDED DEBUG LOG --- 
  const authHeader = request.headers.get('Authorization');
  console.log(`API POST content: Received Authorization header: ${authHeader}`); 
  // --- END DEBUG LOG ---

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

  // --- Try cookie auth FIRST ---
  try {
    console.log('API POST content: Checking cookie auth.');
    const { data: { user: cookieUser }, error: cookieAuthError } = await supabase.auth.getUser();
    if (cookieAuthError) {
      console.error('API POST content: Cookie auth error:', cookieAuthError);
    } else if (cookieUser) {
      console.log('API POST content: Found user via cookie', { id: cookieUser.id, role: cookieUser.role });
      user = cookieUser;
    }
  } catch (err) {
    console.error('API POST content: Cookie auth processing error:', err);
  }

  // --- Try token auth if cookie didn't work ---
  if (!user && authHeader && authHeader.startsWith('Bearer ')) {
      console.log('API POST content: Cookie auth failed or user not found, trying token auth.');
    try {
      const token = authHeader.substring(7);
      console.log('API POST content: Checking token auth');
      const { data: { user: tokenUser }, error: tokenAuthError } = await supabase.auth.getUser(token);
      
      if (tokenAuthError) {
         console.error('API POST content: Token auth error:', tokenAuthError);
      } else if (tokenUser) {
        console.log('API POST content: Found user via token', { id: tokenUser.id, role: tokenUser.role });
        user = tokenUser;
      }
    } catch (err) {
      console.error('API POST content: Token processing error:', err);
    }
  }

  // Check if user exists and is admin
  if (!user) {
    console.log('API POST content: No authenticated user found via token or cookie.');
    return { authorized: false, error: 'Authentication required', userId: null };
  }
  
  if (user.role !== 'administrator') {
    console.log(`API POST content: User ${user.id} is not admin (role: ${user.role})`);
    return { authorized: false, error: 'Admin privileges required', userId: user.id };
  }

  console.log('API POST content: Auth check passed - user is admin');
  return { authorized: true, error: null, userId: user.id };
}


export async function POST(request: NextRequest) {
  // 1. Check Authorization
  const { authorized, error: authError, userId } = await checkAdminAuth(request);
  
  let effectiveUserId = userId;

  // TEMPORARY FALLBACK for debugging - REMOVE before production
  if (!authorized && process.env.NODE_ENV === 'development') {
    console.warn('API POST content: WARNING - Bypassing auth check in development');
    // Attempt to get *any* user ID for author_id fallback
     const cookieStore = cookies();
     const tempSupabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
     );
     const { data: { session } } = await tempSupabase.auth.getSession();
     const tempUserId = session?.user?.id; // Use session user ID if available
     
     if(!tempUserId) {
        console.error('API POST content: FALLBACK FAILED - Could not get any user ID for author');
        return NextResponse.json({ error: 'Fallback failed: No user ID available' }, { status: 500 });
     }
     console.log('API POST content: Using fallback user ID:', tempUserId);
     // Proceed with fallback user ID - THIS IS INSECURE FOR PRODUCTION
     effectiveUserId = tempUserId; 

  } else if (!authorized) {
     // Strict check for production or if fallback disabled
     return NextResponse.json({ error: authError }, { status: authError === 'Authentication required' ? 401 : 403 });
  }

  // If authorized normally or via fallback, proceed with the effective user ID
  return await processCreateContentRequest(request, effectiveUserId);
}

// Helper function to process the actual content creation
async function processCreateContentRequest(request: NextRequest, authorId: string | null) {
  if (!authorId) {
     console.error('API POST content: Processing error - authorId is null');
     return NextResponse.json({ error: 'Internal server error: Missing author ID' }, { status: 500 });
  }
  
  // 2. Parse and Validate Request Body
  let requestBody: CreateContentRequestBody;
  try {
    requestBody = await request.json();
    // Basic validation
    if (!requestBody.title || !requestBody.description || !requestBody.type || !requestBody.accessTierId) {
      return NextResponse.json({ error: 'Missing required fields in request body' }, { status: 400 });
    }
    if (!Array.isArray(requestBody.ageGroups) || !Array.isArray(requestBody.categories)) {
       return NextResponse.json({ error: 'Invalid format for ageGroups or categories' }, { status: 400 });
    }
    // Add check for at least one age group, mirroring the DB function
    if (requestBody.ageGroups.length === 0) {
      return NextResponse.json({ error: 'Content must have at least one age group' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // 3. Use Admin Client with direct approach (no DB triggers)
  const supabaseAdmin = createAdminClient();
  
  try {
    // Validate required data on the API side
    if (requestBody.ageGroups.length === 0) {
      return NextResponse.json({ 
        error: 'Content must have at least one age group' 
      }, { status: 400 });
    }
    
    // Generate a unique slug
    const title = requestBody.title.trim();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = title.toLowerCase()
      .replace(/[^\w-]+/g, '-') 
      .replace(/--+/g, '-')     
      .replace(/^-+|-+$/g, '')  
      + '-' + randomSuffix;
    
    console.log('API POST content: Using simplified direct insertion approach');
    
    // 1. Insert the content item directly first
    console.log('API POST content: Creating content item');
    
    const { data: contentData, error: contentError } = await supabaseAdmin
      .from('content_items')
      .insert({
        title: title,
        description: requestBody.description.trim(),
        type: requestBody.type,
        slug: slug,
        content_body: '',
        published: requestBody.published,
        access_tier_id: requestBody.accessTierId,
        author_id: authorId,
        thumbnail_url: ''
      })
      .select('id')
      .single();
      
    if (contentError) {
      console.error('API POST content: Error inserting content:', contentError);
      return NextResponse.json({ 
        error: `Failed to create content: ${contentError.message}` 
      }, { status: 500 });
    }
    
    if (!contentData || !contentData.id) {
      console.error('API POST content: Content insert succeeded but no ID returned.');
      return NextResponse.json({ 
        error: 'Failed to create content (No ID returned)' 
      }, { status: 500 });
    }
    
    const contentId = contentData.id;
    console.log('API POST content: Content created with ID:', contentId);
    
    // 2. Insert age group associations
    console.log('API POST content: Adding age group associations');
    const ageGroupRecords = requestBody.ageGroups.map(ageGroupId => ({
      content_id: contentId, 
      age_group_id: ageGroupId
    }));
    
    const { error: ageGroupsError } = await supabaseAdmin
      .from('content_age_groups')
      .insert(ageGroupRecords);
    
    if (ageGroupsError) {
      console.error('API POST content: Error inserting age groups:', ageGroupsError);
      // Clean up content since we couldn't add the required age groups
      await supabaseAdmin
        .from('content_items')
        .delete()
        .eq('id', contentId);
        
      return NextResponse.json({ 
        error: `Failed to create age group associations: ${ageGroupsError.message}` 
      }, { status: 500 });
    }
    
    // 3. Insert category associations (if any)
    if (requestBody.categories.length > 0) {
      console.log('API POST content: Adding category associations');
      const categoryRecords = requestBody.categories.map(categoryId => ({
        content_id: contentId, 
        category_id: categoryId
      }));
      
      const { error: categoriesError } = await supabaseAdmin
        .from('content_categories')
        .insert(categoryRecords);
      
      if (categoriesError) {
        console.error('API POST content: Error inserting categories:', categoriesError);
        // Don't clean up content since we successfully created it with age groups
        // Just warn that categories couldn't be added
        return NextResponse.json({ 
          warning: 'Content created but categories could not be associated',
          contentId: contentId
        }, { status: 201 });
      }
    }
    
    console.log('API POST content: Content created successfully with ID:', contentId);
    
    // Return Success Response
    return NextResponse.json({ 
      message: 'Content created successfully', 
      contentId: contentId 
    }, { status: 201 });

  } catch (error: any) {
    console.error('API POST content: Unexpected error during content creation:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
} 