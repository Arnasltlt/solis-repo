import { NextResponse, NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to check admin auth (prioritize cookie)
async function checkAdminAuth(request: NextRequest) {
  console.log('API PATCH content: Starting auth check (cookie first)');
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

  // Try cookie auth FIRST
  try {
    console.log('API PATCH content: Checking cookie auth.');
    const { data: { user: cookieUser }, error: cookieAuthError } = await supabase.auth.getUser();
    if (cookieAuthError) {
      console.error('API PATCH content: Cookie auth error:', cookieAuthError);
    } else if (cookieUser) {
      console.log('API PATCH content: Found user via cookie', { id: cookieUser.id, role: cookieUser.role });
      user = cookieUser;
    }
  } catch (err) {
    console.error('API PATCH content: Cookie auth processing error:', err);
  }

  // Try token auth if cookie didn't work
  const authHeader = request.headers.get('Authorization');
  if (!user && authHeader && authHeader.startsWith('Bearer ')) {
    console.log('API PATCH content: Cookie auth failed or user not found, trying token auth.');
    console.log('API PATCH content: Received Authorization header:', authHeader);
    try {
      const token = authHeader.substring(7);
      console.log('API PATCH content: Checking token auth');
      const { data: { user: tokenUser }, error: tokenAuthError } = await supabase.auth.getUser(token);
      
      if (tokenAuthError) {
         console.error('API PATCH content: Token auth error:', tokenAuthError);
      } else if (tokenUser) {
        console.log('API PATCH content: Found user via token', { id: tokenUser.id, role: tokenUser.role });
        user = tokenUser;
      }
    } catch (err) {
      console.error('API PATCH content: Token processing error:', err);
    }
  } else {
    console.log('API PATCH content: No valid Authorization header found:', authHeader);
  }

  // Check if user exists and is admin
  if (!user) {
    console.log('API PATCH content: No authenticated user found via token or cookie.');
    return { authorized: false, error: 'Authentication required', userId: null };
  }

  // We're in development mode, so assume the user is an admin
  if (process.env.NODE_ENV === 'development') {
    console.log('API PATCH content: DEV mode - treating user as admin');
    return { authorized: true, error: null, userId: user.id };
  }

  // In production, we should verify admin status
  // For now, just accept any authenticated user
  console.log('API PATCH content: Auth check passed - authenticated user');
  return { authorized: true, error: null, userId: user.id };
}

// PATCH endpoint for updating content
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Debug headers
  console.log('API PATCH content: Request headers:');
  request.headers.forEach((value, key) => {
    if (key === 'authorization') {
      console.log(`  ${key}: Bearer ***`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  // 1. Validate the ID parameter
  const contentId = params.id;
  if (!contentId) {
    return NextResponse.json({ error: 'Missing content ID' }, { status: 400 });
  }

  // 2. Check Authorization
  const { authorized, error: authError, userId } = await checkAdminAuth(request);
  
  if (!authorized) {
    // If auth fails, we'll try another approach - bypass auth in dev for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('API PATCH content: WARNING - Bypassing auth check in development mode');
      
      // Proceed with the admin client directly since we're bypassing auth
      const supabaseAdmin = createAdminClient();
      try {
        console.log(`API PATCH content: Updating content ID ${contentId} with admin bypass`);
        
        // Parse the request body
        let requestBody: any;
        try {
          requestBody = await request.json();
        } catch (error) {
          return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        
        // Build the update payload based on what fields are provided
        let updatePayload: any = {};
        
        // Add all valid fields to the update payload
        if (requestBody.content_body !== undefined) updatePayload.content_body = requestBody.content_body;
        if (requestBody.thumbnail_url !== undefined) updatePayload.thumbnail_url = requestBody.thumbnail_url;
        if (requestBody.title !== undefined) updatePayload.title = requestBody.title;
        if (requestBody.description !== undefined) updatePayload.description = requestBody.description;
        if (requestBody.type !== undefined) updatePayload.type = requestBody.type;
        if (requestBody.access_tier_id !== undefined) updatePayload.access_tier_id = requestBody.access_tier_id;
        if (requestBody.published !== undefined) updatePayload.published = requestBody.published;
        
        // Add metadata handling for attachments and other metadata fields for bypass mode
        if (requestBody.metadata !== undefined) {
          // First get existing metadata to properly merge
          const { data: existingData, error: fetchError } = await supabaseAdmin
            .from('content_items')
            .select('metadata')
            .eq('id', contentId)
            .single();
            
          if (fetchError) {
            console.error('API PATCH content (bypass): Error fetching existing metadata:', fetchError);
            // Continue with just the new metadata
            updatePayload.metadata = requestBody.metadata;
          } else {
            // Merge existing metadata with new metadata
            updatePayload.metadata = {
              ...(existingData?.metadata || {}),
              ...requestBody.metadata,
              // Ensure attachments array is preserved
              attachments: Array.isArray(requestBody.metadata.attachments) 
                ? requestBody.metadata.attachments 
                : (existingData?.metadata?.attachments || [])
            };
          }
          
          console.log('API PATCH content (bypass): Updating metadata:', updatePayload.metadata);
        }
        
        // If title is updated, update the slug with a unique value
        if (requestBody.title) {
          const slug = requestBody.title.toLowerCase().replace(/[^\w-]+/g, '-');
          const timestamp = new Date().getTime();
          updatePayload.slug = `${slug}-${timestamp.toString().slice(-6)}`;
        }
        
        console.log('API PATCH content (bypass): Update payload:', updatePayload);
        
        const { error: updateError } = await supabaseAdmin
          .from('content_items')
          .update(updatePayload)
          .eq('id', contentId);

        if (updateError) {
          console.error('API PATCH content: Update error (bypass):', updateError);
          return NextResponse.json({ error: `Failed to update content: ${updateError.message}` }, { status: 500 });
        }
        
        // Update age groups if provided
        if (requestBody.age_groups) {
          // First delete existing relationships
          const { error: deleteAgeGroupError } = await supabaseAdmin
            .from('content_age_groups')
            .delete()
            .eq('content_id', contentId);
          
          if (deleteAgeGroupError) {
            console.error('API PATCH content (bypass): Error deleting age groups:', deleteAgeGroupError);
          }
          
          // Then insert new relationships if any are provided
          if (requestBody.age_groups.length > 0) {
            const ageGroupRelations = requestBody.age_groups.map((ageGroupId: string) => ({
              content_id: contentId,
              age_group_id: ageGroupId
            }));
            
            const { error: insertAgeGroupError } = await supabaseAdmin
              .from('content_age_groups')
              .insert(ageGroupRelations);
            
            if (insertAgeGroupError) {
              console.error('API PATCH content (bypass): Error inserting age groups:', insertAgeGroupError);
            }
          }
        }
        
        // Update categories if provided
        if (requestBody.categories) {
          // First delete existing relationships
          const { error: deleteCategoryError } = await supabaseAdmin
            .from('content_categories')
            .delete()
            .eq('content_id', contentId);
          
          if (deleteCategoryError) {
            console.error('API PATCH content (bypass): Error deleting categories:', deleteCategoryError);
          }
          
          // Then insert new relationships if any are provided
          if (requestBody.categories.length > 0) {
            const categoryRelations = requestBody.categories.map((categoryId: string) => ({
              content_id: contentId,
              category_id: categoryId
            }));
            
            const { error: insertCategoryError } = await supabaseAdmin
              .from('content_categories')
              .insert(categoryRelations);
            
            if (insertCategoryError) {
              console.error('API PATCH content (bypass): Error inserting categories:', insertCategoryError);
            }
          }
        }

        // Return success
        return NextResponse.json({ 
          message: 'Content updated successfully (with auth bypass)',
          contentId: contentId
        }, { status: 200 });
      } catch (error: any) {
        console.error('API PATCH content: Unexpected error in bypass mode:', error);
        return NextResponse.json({ error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: authError }, { status: authError === 'Authentication required' ? 401 : 403 });
  }

  // 3. Parse and Validate Request Body
  let requestBody: any;
  try {
    requestBody = await request.json();
    
    // Check that request body exists
    if (!requestBody) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 4. Update the content using Admin Client
  const supabaseAdmin = createAdminClient();
  try {
    console.log(`API PATCH content: Updating content ID ${contentId}`);
    
    // Build the update payload based on what fields are provided
    let updatePayload: any = {};
    
    // Add all valid fields to the update payload
    if (requestBody.content_body !== undefined) updatePayload.content_body = requestBody.content_body;
    if (requestBody.thumbnail_url !== undefined) updatePayload.thumbnail_url = requestBody.thumbnail_url;
    if (requestBody.title !== undefined) updatePayload.title = requestBody.title;
    if (requestBody.description !== undefined) updatePayload.description = requestBody.description;
    if (requestBody.type !== undefined) updatePayload.type = requestBody.type;
    if (requestBody.access_tier_id !== undefined) updatePayload.access_tier_id = requestBody.access_tier_id;
    if (requestBody.published !== undefined) updatePayload.published = requestBody.published;
    
    // Add metadata handling for attachments and other metadata fields
    if (requestBody.metadata !== undefined) {
      // First get existing metadata to properly merge
      const { data: existingData, error: fetchError } = await supabaseAdmin
        .from('content_items')
        .select('metadata')
        .eq('id', contentId)
        .single();
        
      if (fetchError) {
        console.error('API PATCH content: Error fetching existing metadata:', fetchError);
        // Continue with just the new metadata
        updatePayload.metadata = requestBody.metadata;
      } else {
        // Merge existing metadata with new metadata
        updatePayload.metadata = {
          ...(existingData?.metadata || {}),
          ...requestBody.metadata,
          // Ensure attachments array is preserved
          attachments: Array.isArray(requestBody.metadata.attachments) 
            ? requestBody.metadata.attachments 
            : (existingData?.metadata?.attachments || [])
        };
      }
      
      console.log('API PATCH content: Updating metadata:', updatePayload.metadata);
    }
    
    // If title is updated, update the slug with a unique value
    if (requestBody.title) {
      const slug = requestBody.title.toLowerCase().replace(/[^\w-]+/g, '-');
      const timestamp = new Date().getTime();
      updatePayload.slug = `${slug}-${timestamp.toString().slice(-6)}`;
    }
    
    console.log('API PATCH content: Update payload:', updatePayload);
    
    // Update the content item
    const { error: updateError } = await supabaseAdmin
      .from('content_items')
      .update(updatePayload)
      .eq('id', contentId);

    if (updateError) {
      console.error('API PATCH content: Update error:', updateError);
      return NextResponse.json({ error: `Failed to update content: ${updateError.message}` }, { status: 500 });
    }
    
    // Update age groups if provided
    if (requestBody.age_groups) {
      // First delete existing relationships
      const { error: deleteAgeGroupError } = await supabaseAdmin
        .from('content_age_groups')
        .delete()
        .eq('content_id', contentId);
      
      if (deleteAgeGroupError) {
        console.error('API PATCH content: Error deleting age groups:', deleteAgeGroupError);
        // Continue with other operations
      }
      
      // Then insert new relationships if any are provided
      if (requestBody.age_groups.length > 0) {
        const ageGroupRelations = requestBody.age_groups.map((ageGroupId: string) => ({
          content_id: contentId,
          age_group_id: ageGroupId
        }));
        
        const { error: insertAgeGroupError } = await supabaseAdmin
          .from('content_age_groups')
          .insert(ageGroupRelations);
        
        if (insertAgeGroupError) {
          console.error('API PATCH content: Error inserting age groups:', insertAgeGroupError);
          // Continue with other operations
        }
      }
    }
    
    // Update categories if provided
    if (requestBody.categories) {
      // First delete existing relationships
      const { error: deleteCategoryError } = await supabaseAdmin
        .from('content_categories')
        .delete()
        .eq('content_id', contentId);
      
      if (deleteCategoryError) {
        console.error('API PATCH content: Error deleting categories:', deleteCategoryError);
        // Continue with other operations
      }
      
      // Then insert new relationships if any are provided
      if (requestBody.categories.length > 0) {
        const categoryRelations = requestBody.categories.map((categoryId: string) => ({
          content_id: contentId,
          category_id: categoryId
        }));
        
        const { error: insertCategoryError } = await supabaseAdmin
          .from('content_categories')
          .insert(categoryRelations);
        
        if (insertCategoryError) {
          console.error('API PATCH content: Error inserting categories:', insertCategoryError);
          // Continue with other operations
        }
      }
    }

    // 5. Return success
    return NextResponse.json({ 
      message: 'Content updated successfully',
      contentId: contentId
    }, { status: 200 });
  } catch (error: any) {
    console.error('API PATCH content: Unexpected error:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}

// DELETE endpoint for removing content
export async function DELETE(
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
    // If auth fails, we'll try another approach - bypass auth in dev for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('API DELETE content: WARNING - Bypassing auth check in development mode');
      
      // Proceed with the admin client directly since we're bypassing auth
      const supabaseAdmin = createAdminClient();
      try {
        console.log(`API DELETE content: Deleting content ID ${contentId} with admin bypass`);
        
        // Delete references in related tables first to avoid foreign key constraints
        console.log('API DELETE content: Deleting related records first...');
        
        try {
          const { error: ageGroupsError } = await supabaseAdmin
            .from('content_age_groups')
            .delete()
            .eq('content_id', contentId);
            
          if (ageGroupsError) {
            console.error('API DELETE content: Error deleting age groups:', ageGroupsError);
            // Continue anyway
          }
          
          const { error: categoriesError } = await supabaseAdmin
            .from('content_categories')
            .delete()
            .eq('content_id', contentId);
            
          if (categoriesError) {
            console.error('API DELETE content: Error deleting categories:', categoriesError);
            // Continue anyway
          }
          
          const { error: feedbackError } = await supabaseAdmin
            .from('content_feedback')
            .delete()
            .eq('content_id', contentId);
            
          if (feedbackError) {
            console.error('API DELETE content: Error deleting feedback:', feedbackError);
            // Continue anyway
          }
        } catch (relatedError) {
          console.error('API DELETE content: Error deleting related records:', relatedError);
          // Continue to delete the main content
        }
        
        // Finally delete the content item
        const { error: deleteError } = await supabaseAdmin
          .from('content_items')
          .delete()
          .eq('id', contentId);

        if (deleteError) {
          console.error('API DELETE content: Delete error (bypass):', deleteError);
          return NextResponse.json({ error: `Failed to delete content: ${deleteError.message}` }, { status: 500 });
        }

        // Return success
        return NextResponse.json({ 
          message: 'Content deleted successfully (with auth bypass)',
          contentId: contentId
        }, { status: 200 });
      } catch (error: any) {
        console.error('API DELETE content: Unexpected error in bypass mode:', error);
        return NextResponse.json({ error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: authError }, { status: authError === 'Authentication required' ? 401 : 403 });
  }

  // 3. Delete content using Admin Client
  const supabaseAdmin = createAdminClient();
  try {
    console.log(`API DELETE content: Deleting content ID ${contentId}`);
    
    // Delete references in related tables first to avoid foreign key constraints
    console.log('API DELETE content: Deleting related records first...');
    
    try {
      const { error: ageGroupsError } = await supabaseAdmin
        .from('content_age_groups')
        .delete()
        .eq('content_id', contentId);
        
      if (ageGroupsError) {
        console.error('API DELETE content: Error deleting age groups:', ageGroupsError);
        // Continue anyway
      }
      
      const { error: categoriesError } = await supabaseAdmin
        .from('content_categories')
        .delete()
        .eq('content_id', contentId);
        
      if (categoriesError) {
        console.error('API DELETE content: Error deleting categories:', categoriesError);
        // Continue anyway
      }
      
      const { error: feedbackError } = await supabaseAdmin
        .from('content_feedback')
        .delete()
        .eq('content_id', contentId);
        
      if (feedbackError) {
        console.error('API DELETE content: Error deleting feedback:', feedbackError);
        // Continue anyway
      }
    } catch (relatedError) {
      console.error('API DELETE content: Error deleting related records:', relatedError);
      // Continue to delete the main content
    }
    
    // Finally delete the content item
    const { error: deleteError } = await supabaseAdmin
      .from('content_items')
      .delete()
      .eq('id', contentId);

    if (deleteError) {
      console.error('API DELETE content: Delete error:', deleteError);
      return NextResponse.json({ error: `Failed to delete content: ${deleteError.message}` }, { status: 500 });
    }

    // Return success
    return NextResponse.json({ 
      message: 'Content deleted successfully',
      contentId: contentId
    }, { status: 200 });
  } catch (error: any) {
    console.error('API DELETE content: Unexpected error:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
} 