import { NextRequest, NextResponse } from 'next/server'
// Use the correct SSR helper for Route Handlers: createServerClient
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'
import { getCachedReferenceData, getCachedContentItems } from '@/lib/utils/data-fetching'
import { serializeForClient } from '@/lib/utils/serialization'

// Simple server-side rate limiting for API routes
const RATE_LIMITS = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 60 // 60 requests per minute

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    
    // Validate required fields
    if (!formData.title || !formData.type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }
    
    // Create a Supabase client using createServerClient with cookie methods
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
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) { 
              // Handle error
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) { 
              // Handle error
            }
          }
        },
      }
    )
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession()
    
    // Use the user's ID if authenticated, or generate a test ID
    const userId = session?.user?.id || uuidv4()
    
    // Generate a slug from the title
    const slug = slugify(formData.title, { lower: true, strict: true })
    
    // Use a default thumbnail if none provided
    const thumbnailUrl = formData.thumbnailUrl || 'https://placehold.co/600x400/png?text=No+Thumbnail'
    
    // Prepare content data
    const content = {
      title: formData.title,
      description: formData.description || '',
      type: formData.type,
      content_body: formData.contentBody || '',
      slug,
      thumbnail_url: thumbnailUrl,
      published: formData.published,
      author_id: userId,
      access_tier_id: formData.accessTierId,
      metadata: formData.description ? { description: formData.description } : {}
    }
    
    console.log('Creating content with data:', content)
    
    // Insert content
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .insert(content)
      .select('*')
      .single()
    
    if (contentError) {
      console.error('Content creation error:', contentError)
      return NextResponse.json(
        { error: `Failed to create content: ${contentError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Content created successfully:', contentItem)
    
    // Create relationships for age groups
    if (formData.ageGroups && formData.ageGroups.length > 0) {
      const ageGroupRelations = formData.ageGroups.map((ageGroupId: string) => ({
        content_id: contentItem.id,
        age_group_id: ageGroupId
      }))
      
      console.log('Creating age group relations:', ageGroupRelations)
      
      const { error: ageGroupError } = await supabase
        .from('content_age_groups')
        .insert(ageGroupRelations)
      
      if (ageGroupError) {
        console.error('Age group relation error:', ageGroupError)
        return NextResponse.json(
          { error: `Failed to associate age groups: ${ageGroupError.message}` },
          { status: 500 }
        )
      }
    }
    
    // Create relationships for categories
    if (formData.categories && formData.categories.length > 0) {
      const categoryRelations = formData.categories.map((categoryId: string) => ({
        content_id: contentItem.id,
        category_id: categoryId
      }))
      
      console.log('Creating category relations:', categoryRelations)
      
      const { error: categoryError } = await supabase
        .from('content_categories')
        .insert(categoryRelations)
      
      if (categoryError) {
        console.error('Category relation error:', categoryError)
        return NextResponse.json(
          { error: `Failed to associate categories: ${categoryError.message}` },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(contentItem)
  } catch (error) {
    console.error('Content creation failed:', error)
    return NextResponse.json(
      { error: 'An unknown error occurred while creating content' },
      { status: 500 }
    )
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Helper function to check and update rate limits
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const rateData = RATE_LIMITS.get(ip)
  
  if (!rateData) {
    // First request from this IP
    RATE_LIMITS.set(ip, { count: 1, timestamp: now })
    return true
  }
  
  if (now - rateData.timestamp > RATE_LIMIT_WINDOW) {
    // Rate limit window has passed, reset counter
    RATE_LIMITS.set(ip, { count: 1, timestamp: now })
    return true
  }
  
  if (rateData.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    return false
  }
  
  // Increment counter and allow the request
  RATE_LIMITS.set(ip, { count: rateData.count + 1, timestamp: rateData.timestamp })
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    // Fetch all necessary data in parallel
    // Add timeout handling to prevent hanging requests
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Data fetching timeout')), 10000)
    );
    
    // We'll handle each promise individually to improve error resilience
    const referenceDataPromise = getCachedReferenceData().catch(error => {
      console.error('Error fetching reference data:', error);
      // Return default empty values on error
      return { 
        ageGroups: [], 
        categories: [],
        accessTiers: []
      };
    });
    
    const contentItemsPromise = getCachedContentItems().catch(error => {
      console.error('Error fetching content items:', error);
      // Return empty array on error
      return [];
    });
    
    // Wait for both promises with timeout
    const [referenceData, contentItems] = await Promise.race([
      Promise.all([referenceDataPromise, contentItemsPromise]),
      timeout
    ]) as [any, any];
    
    // If we get here, dataPromise resolved before timeout
    const { ageGroups, categories } = referenceData;
    
    // Default to empty arrays if data is missing
    const safeAgeGroups = Array.isArray(ageGroups) ? ageGroups : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeContentItems = Array.isArray(contentItems) ? contentItems : [];
    
    // Serialize data before returning as JSON
    let serializedContent, serializedAgeGroups, serializedCategories;

    try {
      serializedContent = serializeForClient(safeContentItems);
      serializedAgeGroups = serializeForClient(safeAgeGroups);
      serializedCategories = serializeForClient(safeCategories);

      // Ensure all serialized data is properly structured
      const responseData = {
        content: Array.isArray(serializedContent) ? serializedContent : [],
        ageGroups: Array.isArray(serializedAgeGroups) ? serializedAgeGroups : [],
        categories: Array.isArray(serializedCategories) ? serializedCategories : []
      };

      // Validate that the response can be JSON serialized
      const testSerialization = JSON.stringify(responseData);

      // Return the data
      return NextResponse.json(responseData);
    } catch (serializationError) {
      console.error('Serialization error in content API:', serializationError);
      console.error('Content items type:', typeof safeContentItems);
      console.error('Age groups type:', typeof safeAgeGroups);
      console.error('Categories type:', typeof safeCategories);

      // Return empty arrays as fallback
      return NextResponse.json({
        content: [],
        ageGroups: [],
        categories: []
      });
    }
  } catch (error: any) {
    // Log detailed error information
    console.error('Error in content API route:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        status: 'error'
      }, 
      { status: 500 }
    )
  }
} 