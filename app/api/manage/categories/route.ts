import { NextResponse, NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createCategoryOnServer } from '@/lib/services/categories'
import type { Database } from '@/lib/types/database'

// Force dynamic rendering to avoid static generation issues with cookies
export const dynamic = 'force-dynamic'

// Define the expected request body type locally
type CreateCategoryRequestBody = {
  name: string;
  description?: string;
  parent_id?: string | null; // Include parent_id if needed for insert type
}

export async function POST(request: NextRequest) {
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
        }
      },
    }
  )

  // Verify session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Verify admin via users/access_tiers
  const userId = session.user.id
  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier_id')
    .eq('id', userId)
    .single()
  if (!userRow?.subscription_tier_id) {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }
  const { data: tierRow } = await supabase
    .from('access_tiers')
    .select('name')
    .eq('id', userRow.subscription_tier_id)
    .single()
  if (!tierRow || tierRow.name !== 'administrator') {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  return await processCreateCategoryRequest(request)
}

// Helper function to process the category creation
async function processCreateCategoryRequest(request: NextRequest) {
  // Parse and Validate Request Body
  let requestBody: CreateCategoryRequestBody
  try {
    requestBody = await request.json()
    // Validate required fields
    if (!requestBody.name || typeof requestBody.name !== 'string' || requestBody.name.trim() === '') {
        return NextResponse.json({ error: 'Missing or invalid required field: name' }, { status: 400 });
    }
    // Optional: Validate description type if provided
    if (requestBody.description && typeof requestBody.description !== 'string') {
      return NextResponse.json({ error: 'Invalid field type: description must be a string' }, { status: 400 });
    }
    // Optional: Validate parent_id type if provided
    if (requestBody.parent_id && typeof requestBody.parent_id !== 'string') {
      return NextResponse.json({ error: 'Invalid field type: parent_id must be a string or null' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Call Server-Side Service Function using the ADMIN client
  const supabaseAdmin = createAdminClient() 
  try {
    const { data: newCategory, error: createError } = await createCategoryOnServer(
      supabaseAdmin, // Use the admin client here
      requestBody.name,
      requestBody.description
    )

    // Handle Result
    if (createError) {
      console.error('Error creating category:', createError.message)
      // Return specific error message from service if available, otherwise generic
      const errorMessage = createError.message.includes('jau egzistuoja') 
                         ? 'Category with this name already exists' 
                         : 'Failed to create category';
      const statusCode = errorMessage.includes('already exists') ? 409 : 500; // 409 Conflict
      return NextResponse.json({ error: errorMessage }, { status: statusCode })
    }

    if (!newCategory) {
        // This case should ideally be covered by createError, but handle defensively
        return NextResponse.json({ error: 'Failed to create category (unknown reason)' }, { status: 500 })
    }

    // Return Successful Response
    return NextResponse.json(newCategory, { status: 201 }) // 201 Created status

  } catch (error) {
    console.error('API error creating category:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating the category' },
      { status: 500 }
    )
  }
} 