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
  description?: string; // optional, stored in metadata only
  type: 'video' | 'audio' | 'lesson_plan' | 'game';
  published: boolean;
  accessTierId: string;
  ageGroups: string[]; // Array of age group IDs
  categories: string[]; // Array of category IDs
  // thumbnail data might be handled separately later or passed as base64/formdata
  metadata?: Record<string, any>; // optional metadata (e.g., attachments)
}

// Helper function to check admin auth (session + DB tier check)
async function checkAdminAuth() {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  
  if (!userId) {
    return { authorized: false, error: 'Authentication required', userId: null }
  }

  // Check admin via users/access_tiers
  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier_id')
    .eq('id', userId)
    .single()

  if (!userRow?.subscription_tier_id) {
    return { authorized: false, error: 'Admin privileges required', userId }
  }

  const { data: tierRow } = await supabase
    .from('access_tiers')
    .select('name')
    .eq('id', userRow.subscription_tier_id)
    .single()

  if (!tierRow || tierRow.name !== 'administrator') {
    return { authorized: false, error: 'Admin privileges required', userId }
  }

  return { authorized: true, error: null, userId }
}


export async function POST(request: NextRequest) {
  // 1. Check Authorization
  const { authorized, error: authError, userId } = await checkAdminAuth();
  if (!authorized || !userId) {
    return NextResponse.json({ error: authError }, { status: authError === 'Authentication required' ? 401 : 403 })
  }
  // If authorized, proceed with the user ID
  return await processCreateContentRequest(request, userId);
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
    if (!requestBody.title || !requestBody.type || !requestBody.accessTierId) {
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

  // 3. Use Admin Client and call a transactional RPC to satisfy DB constraints
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
    
    console.log('API POST content: Using direct database operations to create content');
    
    // Use a transaction with direct database operations
    const contentId = randomUUID();
    
    try {
      // Start transaction by inserting content
      const { data: insertedContent, error: insertError } = await supabaseAdmin
        .from('content_items')
        .insert({
          id: contentId,
          title: title,
          description: requestBody.description?.trim() || '',
          type: requestBody.type,
          slug: slug,
          content_body: '',
          published: requestBody.published,
          access_tier_id: requestBody.accessTierId,
          author_id: authorId,
          thumbnail_url: '',
          // Persist metadata and include description if provided
          metadata: {
            ...(requestBody.metadata || {}),
            ...(requestBody.description ? { description: requestBody.description } : {})
          }
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('API POST content: Error inserting content:', insertError);
        throw new Error(`Failed to create content: ${insertError.message}`);
      }

      console.log('API POST content: Content inserted with ID:', contentId);

      // Insert age group relations
      if (requestBody.ageGroups && requestBody.ageGroups.length > 0) {
        const ageGroupRelations = requestBody.ageGroups.map(ageGroupId => ({
          content_id: contentId,
          age_group_id: ageGroupId
        }));

        const { error: ageGroupError } = await supabaseAdmin
          .from('content_age_groups')
          .insert(ageGroupRelations);

        if (ageGroupError) {
          console.error('API POST content: Error inserting age group relations:', ageGroupError);
          // Try to cleanup the content item
          await supabaseAdmin.from('content_items').delete().eq('id', contentId);
          throw new Error(`Failed to create age group relations: ${ageGroupError.message}`);
        }

        console.log('API POST content: Age group relations inserted');
      }

      // Insert category relations if provided
      if (requestBody.categories && requestBody.categories.length > 0) {
        const categoryRelations = requestBody.categories.map(categoryId => ({
          content_id: contentId,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabaseAdmin
          .from('content_categories')
          .insert(categoryRelations);

        if (categoryError) {
          console.error('API POST content: Error inserting category relations:', categoryError);
          // Cleanup is less critical for categories as content already exists
          console.log('API POST content: Content created but category relations failed');
        } else {
          console.log('API POST content: Category relations inserted');
        }
      }

      console.log('API POST content: Content created successfully with ID:', contentId);
      return NextResponse.json({ 
        message: 'Content created successfully', 
        contentId: contentId 
      }, { status: 201 });
    
    } catch (directInsertError: any) {
      console.error('API POST content: Direct insert error:', directInsertError);
      return NextResponse.json({ 
        error: `Failed to create content: ${directInsertError.message}` 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API POST content: Unexpected error during content creation:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
} 