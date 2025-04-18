import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateUserTier } from '@/lib/services/users'

// PATCH /api/users/[userId] - Update a user's subscription tier
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const { tierId } = await request.json()
    
    if (!userId || !tierId) {
      return NextResponse.json(
        { error: 'User ID and tier ID are required' },
        { status: 400 }
      )
    }
    
    // Create a Supabase client with cookies
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Check if the current user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json(
        { error: 'Error checking authentication: ' + sessionError.message },
        { status: 500 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get the current user's tier
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier_id')
      .eq('id', session.user.id)
      .single()
    
    if (userError) {
      return NextResponse.json(
        { error: 'Failed to verify user permissions: ' + userError.message },
        { status: 500 }
      )
    }
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      )
    }
    
    // Get the tier name for the user's subscription tier
    const { data: tierData, error: tierError } = await supabase
      .from('access_tiers')
      .select('name')
      .eq('id', userData.subscription_tier_id)
      .single()
    
    if (tierError) {
      return NextResponse.json(
        { error: 'Failed to verify user tier: ' + tierError.message },
        { status: 500 }
      )
    }
    
    if (!tierData) {
      return NextResponse.json(
        { error: 'Tier record not found' },
        { status: 404 }
      )
    }
    
    // Only allow admins to update user tiers
    if (tierData.name !== 'administrator') {
      return NextResponse.json(
        { error: 'Only administrators can manage users' },
        { status: 403 }
      )
    }
    
    // Update the user's tier
    const success = await updateUserTier(userId, tierId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user tier' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in API route:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
} 