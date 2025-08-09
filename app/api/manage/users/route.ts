import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET endpoint for retrieving all users
export async function GET(request: NextRequest) {
  try {
    console.log('USERS API: Starting request');
    
    // Check that environment variables exist
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('USERS API: Missing required Supabase environment variables');
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
    
    console.log('USERS API: Admin client created, fetching users');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .auth.admin
      .listUsers();
    
    if (usersError) {
      console.error('USERS API: Error fetching users:', usersError);
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
      console.error('USERS API: Error fetching access tiers:', tiersError);
      return NextResponse.json(
        { error: `Failed to fetch access tiers: ${tiersError.message}` }, 
        { status: 500 }
      );
    }
    
    // Map user roles to access tier names
    const roleToTierMap = {
      'administrator': process.env.ADMINISTRATOR_TIER_ID || '', // administrator tier ID
      'authenticated': process.env.FREE_TIER_ID || ''  // free tier ID
    };
    
    // Add tier name to each user (strictly metadata/tier-based, ignore JWT role)
    const usersWithTierName = users?.users?.map((user: any) => {
      const subscription_tier_id = user.user_metadata?.subscription_tier_id || user.subscription_tier_id;
      const tier = tiers?.find(t => t.id === subscription_tier_id);
      const tierName = tier?.name || 'unknown';

      return {
        ...user,
        id: user.id,
        email: user.email,
        subscription_tier_id,
        tierName
      }
    });
    
    console.log(`USERS API: Successfully fetched ${usersWithTierName?.length || 0} users`);
    
    return NextResponse.json({ 
      users: usersWithTierName || [],
      message: 'Users fetched successfully'
    });
  } catch (error: any) {
    console.error('USERS API: Unexpected error:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 