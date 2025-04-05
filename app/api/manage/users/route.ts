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
      'administrator': '0aae0bac-7b10-4523-b148-0ab20c73ce13', // administrator tier ID
      'authenticated': 'de4f073e-7f48-43b3-bded-0b39fd14a0cf'  // free tier ID
    };
    
    // Add tier name to each user
    const usersWithTierName = users?.users?.map((user: any) => {
      // Check both direct property and in user_metadata
      let subscription_tier_id = user.subscription_tier_id || user.user_metadata?.subscription_tier_id;
      
      // If no tier ID is found, use role-based mapping
      if (!subscription_tier_id && user.role) {
        subscription_tier_id = roleToTierMap[user.role as keyof typeof roleToTierMap];
        console.log(`USERS API: No tier_id found for user ${user.id}, using role-based mapping: ${user.role} -> ${subscription_tier_id}`);
      }
      
      const tier = tiers?.find(t => t.id === subscription_tier_id);
      
      // Get role-based tier if no subscription tier is found
      let tierName = tier?.name;
      if (!tierName && user.role === 'administrator') {
        tierName = 'administrator';
      } else if (!tierName) {
        // Default to role-based tier name if no subscription tier is found
        tierName = user.role === 'authenticated' ? 'free' : 'unknown';
      }
      
      return {
        ...user,
        id: user.id,
        email: user.email,
        subscription_tier_id: subscription_tier_id,
        tierName: tierName
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