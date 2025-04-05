import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Simplified GET endpoint for retrieving all users in development mode
export async function GET(request: NextRequest) {
  try {
    console.log('DIRECT USERS API: Starting request');
    
    // Check that environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('DIRECT USERS API: Missing required Supabase environment variables');
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
    
    console.log('DIRECT USERS API: Admin client created, fetching users');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('DIRECT USERS API: Error fetching users:', usersError);
      return NextResponse.json(
        { error: `Failed to fetch users: ${usersError.message}` }, 
        { status: 500 }
      );
    }
    
    // Get all access tiers
    const { data: tiers, error: tiersError } = await supabaseAdmin
      .from('access_tiers')
      .select('*');
    
    if (tiersError) {
      console.error('DIRECT USERS API: Error fetching access tiers:', tiersError);
      return NextResponse.json(
        { error: `Failed to fetch access tiers: ${tiersError.message}` }, 
        { status: 500 }
      );
    }
    
    // Add tier name to each user
    const usersWithTierName = users?.map(user => {
      const tier = tiers?.find(t => t.id === user.subscription_tier_id);
      return {
        ...user,
        tierName: tier?.name
      }
    });
    
    console.log(`DIRECT USERS API: Successfully fetched ${usersWithTierName?.length || 0} users`);
    
    return NextResponse.json({ 
      users: usersWithTierName || [],
      message: 'Users fetched successfully'
    });
  } catch (error: any) {
    console.error('DIRECT USERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 