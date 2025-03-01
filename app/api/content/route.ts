import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'

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
    
    // Create a Supabase client with server-side auth
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
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
      access_tier_id: formData.accessTierId
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