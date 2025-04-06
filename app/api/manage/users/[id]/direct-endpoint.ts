import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Simplified PATCH endpoint for updating a user's tier in development mode
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DIRECT USER UPDATE API: Starting request');
    
    // 1. Validate the ID parameter
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Check that environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('DIRECT USER UPDATE API: Missing required Supabase environment variables');
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
    
    console.log(`DIRECT USER UPDATE API: Updating user ${userId} to tier ${tierId}`);
    
    // Update the user's tier
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ subscription_tier_id: tierId })
      .eq('id', userId);

    if (updateError) {
      console.error('DIRECT USER UPDATE API: Update error:', updateError);
      return NextResponse.json({ error: `Failed to update user: ${updateError.message}` }, { status: 500 });
    }
    
    // Verify the update was successful
    const { data: updatedUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('subscription_tier_id')
      .eq('id', userId)
      .single();
    
    if (verifyError || !updatedUser) {
      console.error('DIRECT USER UPDATE API: Verify error:', verifyError);
      return NextResponse.json({ error: 'Failed to verify update' }, { status: 500 });
    }
    
    const success = updatedUser.subscription_tier_id === tierId;
    
    console.log(`DIRECT USER UPDATE API: User update ${success ? 'successful' : 'failed'}`);
    
    return NextResponse.json({ 
      success,
      message: success ? 'User updated successfully' : 'Update verification failed',
      userId: userId,
      tierId: tierId
    }, { status: success ? 200 : 500 });
  } catch (error: any) {
    console.error('DIRECT USER UPDATE API: Unexpected error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 