import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // First verify the user is authenticated and is an administrator
    const cookieStore = cookies()
    const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check if the current user is authenticated
    const { data: { session }, error: sessionError } = await authClient.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get the current user's tier
    const { data: userData, error: userError } = await authClient
      .from('users')
      .select('subscription_tier_id')
      .eq('id', session.user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }
    
    // Get the tier name for the user's subscription tier
    const { data: tierData, error: tierError } = await authClient
      .from('access_tiers')
      .select('name')
      .eq('id', userData.subscription_tier_id)
      .single()
    
    if (tierError || !tierData) {
      return NextResponse.json(
        { error: 'Failed to verify user tier' },
        { status: 500 }
      )
    }
    
    // Only allow admins to use this endpoint
    if (tierData.name !== 'administrator') {
      return NextResponse.json(
        { error: 'Only administrators can use this endpoint' },
        { status: 403 }
      )
    }
    
    // Get URL parameters
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const tierName = searchParams.get('tierName')
    
    if (!userId || !tierName) {
      return NextResponse.json(
        { error: 'userId and tierName are required parameters' },
        { status: 400 }
      )
    }
    
    // Create a Supabase client with direct API key access
    // This bypasses RLS policies using the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
    
    // Get the tier ID for the requested tier name
    const { data: targetTierData, error: targetTierError } = await supabase
      .from('access_tiers')
      .select('id')
      .eq('name', tierName)
      .single()
    
    if (targetTierError || !targetTierData) {
      return NextResponse.json({ 
        error: 'Failed to find tier' 
      }, { status: 500 })
    }
    
    const tierId = targetTierData.id
    
    // Update the user's tier using admin privileges
    const { error } = await supabase
      .from('users')
      .update({ subscription_tier_id: tierId })
      .eq('id', userId)
    
    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update user tier'
      }, { status: 500 })
    }
    
    // Verify the update was successful
    const { data: updatedUser, error: verifyError } = await supabase
      .from('users')
      .select('subscription_tier_id')
      .eq('id', userId)
      .single()
    
    if (verifyError || !updatedUser) {
      return NextResponse.json({ 
        error: 'Failed to verify update'
      }, { status: 500 })
    }
    
    const success = updatedUser.subscription_tier_id === tierId
    
    return NextResponse.json({
      success,
      userId,
      tierName,
      tierId
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred'
    }, { status: 500 })
  }
} 