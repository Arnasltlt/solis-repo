import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PATCH endpoint for updating a user's tier
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('USER UPDATE API: Starting request');
    
    // 1. Validate the ID parameter
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Check that environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('USER UPDATE API: Missing required Supabase environment variables');
      return NextResponse.json(
        { error: 'Missing required Supabase environment variables' }, 
        { status: 500 }
      );
    }
    
    // Create admin client directly
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Parse request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const tierId = requestBody.tierId;
    if (!tierId) {
      return NextResponse.json({ error: 'Missing tierId in request body' }, { status: 400 });
    }
    
    console.log(`USER UPDATE API: Updating user ${userId} to tier ${tierId}`);
    
    // Update the user's tier
    try {
      // First, get the user to get their current metadata
      const { data: userData, error: getUserError } = await supabaseAdmin
        .auth.admin.getUserById(userId);
        
      if (getUserError) {
        console.error('USER UPDATE API: Error getting user:', getUserError);
        return NextResponse.json({ error: `Failed to get user: ${getUserError.message}` }, { status: 500 });
      }
      
      if (!userData || !userData.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Update the user's metadata to include the subscription tier
      const userMetadata = {
        ...userData.user.user_metadata,
        subscription_tier_id: tierId
      };
      
      // Update user with new metadata
      const { error: updateError } = await supabaseAdmin
        .auth.admin.updateUserById(
          userId,
          { 
            user_metadata: userMetadata,
            role: tierId === "0aae0bac-7b10-4523-b148-0ab20c73ce13" ? "administrator" : "authenticated"
          }
        );

      if (updateError) {
        console.error('USER UPDATE API: Update error:', updateError);
        return NextResponse.json({ error: `Failed to update user: ${updateError.message}` }, { status: 500 });
      }
      
      // Verify the update was successful by getting the user again
      const { data: updatedUserData, error: verifyError } = await supabaseAdmin
        .auth.admin.getUserById(userId);
      
      if (verifyError || !updatedUserData || !updatedUserData.user) {
        console.error('USER UPDATE API: Verify error:', verifyError);
        return NextResponse.json({ error: 'Failed to verify update' }, { status: 500 });
      }
      
      const success = updatedUserData.user.user_metadata?.subscription_tier_id === tierId;
      
      console.log(`USER UPDATE API: User update ${success ? 'successful' : 'failed'}`);
      
      return NextResponse.json({ 
        success,
        message: success ? 'User updated successfully' : 'Update verification failed',
        userId: userId,
        tierId: tierId
      }, { status: success ? 200 : 500 });
    } catch (error: any) {
      console.error('USER UPDATE API: Error during update process:', error);
      return NextResponse.json(
        { error: `Error during update process: ${error.message || 'Unknown error'}` }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('USER UPDATE API: Unexpected error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 