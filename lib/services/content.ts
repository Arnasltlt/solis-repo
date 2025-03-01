import type { ContentType } from '@/lib/types/content'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { Database, ContentItem } from '@/lib/types/database'
import slugify from 'slugify'

interface ContentFormData {
  title: string
  description?: string
  type: ContentType
  ageGroups: string[]
  categories: string[]
  accessTierId: string
  thumbnail?: File | string | null
  contentBody?: string | null
  contentUrl?: string | null
  contentFile?: string | null
  contentText?: string | null
  published: boolean
}

// Define the CreateContentRequest type to match ContentFormData
export interface CreateContentRequest {
  title: string
  description: string
  type: ContentType
  ageGroups: string[]
  categories: string[]
  accessTierId: string
  contentBody: string
  published: boolean
  thumbnail: File | null
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper function to get the appropriate client
function getClient(adminClient?: SupabaseClient) {
  return adminClient || supabase
}

export async function getAgeGroups(adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  console.log('DEBUG - Fetching age groups')
  
  const { data, error } = await client
    .from('age_groups')
    .select('*')
    .order('range')
  
  if (error) {
    console.error('DEBUG - Error fetching age groups:', error)
    throw error
  }
  
  console.log('DEBUG - Age groups fetched:', data)
  return data
}

export async function getCategories(adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  console.log('DEBUG - Fetching categories')
  
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('DEBUG - Error fetching categories:', error)
    throw error
  }
  
  console.log('DEBUG - Categories fetched:', data)
  return data
}

export async function getAccessTiers(adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  const { data, error } = await client
    .from('access_tiers')
    .select('*')
    .order('level')
  
  if (error) throw error
  return data
}

export async function getContentItems({
  ageGroups,
  categories,
  searchQuery,
  adminClient
}: {
  ageGroups?: string[]
  categories?: string[]
  searchQuery?: string
  adminClient?: SupabaseClient
} = {}) {
  const client = getClient(adminClient)
  console.log('DEBUG - Fetching content items with filters:', { ageGroups, categories, searchQuery })
  
  // Start with a base query
  let query = client
    .from('content_items')
    .select(`
      *,
      access_tier:access_tiers!content_items_access_tier_id_fkey(*),
      age_groups:content_age_groups(
        age_group:age_groups(*)
      ),
      categories:content_categories(
        category:categories(*)
      )
    `)
    .eq('published', true)

  // Apply age groups filter if provided
  if (ageGroups && ageGroups.length > 0) {
    console.log('DEBUG - Applying age groups filter:', ageGroups)
    // First get the content IDs that match any of the age groups
    const { data: contentIds, error: ageGroupError } = await client
      .from('content_age_groups')
      .select('content_id')
      .in('age_group_id', ageGroups)
    
    if (ageGroupError) {
      console.error('DEBUG - Error fetching content IDs for age groups:', ageGroupError)
      throw ageGroupError
    }
    
    // Then filter the main query by these content IDs
    if (contentIds && contentIds.length > 0) {
      const ids = contentIds.map(item => item.content_id)
      console.log('DEBUG - Filtering by content IDs for age groups:', ids)
      query = query.in('id', ids)
    } else {
      // If no content matches these age groups, return empty result
      console.log('DEBUG - No content found for age groups:', ageGroups)
      return []
    }
  }

  // Apply categories filter if provided
  if (categories && categories.length > 0) {
    console.log('DEBUG - Applying categories filter:', categories)
    // First get the content IDs that match any of the categories
    const { data: contentIds, error: categoriesError } = await client
      .from('content_categories')
      .select('content_id')
      .in('category_id', categories)
    
    if (categoriesError) {
      console.error('DEBUG - Error fetching content IDs for categories:', categoriesError)
      throw categoriesError
    }
    
    // Then filter the main query by these content IDs
    if (contentIds && contentIds.length > 0) {
      const ids = contentIds.map(item => item.content_id)
      console.log('DEBUG - Filtering by content IDs for categories:', ids)
      query = query.in('id', ids)
    } else {
      // If no content matches these categories, return empty result
      console.log('DEBUG - No content found for categories:', categories)
      return []
    }
  }

  if (searchQuery) {
    console.log('DEBUG - Applying search query:', searchQuery)
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('DEBUG - Error fetching content items:', error)
    throw error
  }
  
  console.log('DEBUG - Content items fetched:', data.length)
  
  // Transform the data to match the expected format
  return data.map(item => ({
    ...item,
    age_groups: item.age_groups?.map((ag: any) => ag.age_group) || [],
    categories: item.categories?.map((cc: any) => cc.category) || [],
    access_tier: {
      id: item.access_tier_id,
      name: item.access_tier?.name || 'free',
      level: item.access_tier?.level || 0,
      features: item.access_tier?.features || {}
    }
  }))
}

// Insert sample content items for testing
export async function insertSampleContent(adminClient?: SupabaseClient) {
  const client = getClient(adminClient)

  // First get an age group, category, and access tiers
  const [ageGroups, categories, accessTiers] = await Promise.all([
    getAgeGroups(client),
    getCategories(client),
    getAccessTiers(client)
  ])

  if (!ageGroups.length || !categories.length || !accessTiers.length) {
    throw new Error('Required data not found')
  }

  // Get tier IDs
  const freeTierId = accessTiers.find((tier: { name: string }) => tier.name === 'free')?.id
  const premiumTierId = accessTiers.find((tier: { name: string }) => tier.name === 'premium')?.id

  if (!freeTierId || !premiumTierId) {
    throw new Error('Access tiers not found')
  }

  const sampleContents = [
    {
      title: 'Pavasario šokis',
      description: 'Linksmas šokis vaikams, švenčiantis pavasario atėjimą',
      type: 'video' as const,
      published: true,
      vimeo_id: '123456789',
      thumbnail_url: 'https://picsum.photos/seed/dance/400/300',
      author_id: 'system',
      access_tier_id: freeTierId
    },
    {
      title: 'Muzikos ritmo pamoka',
      description: 'Interaktyvi muzikos pamoka mažiesiems',
      type: 'audio' as const,
      published: true,
      audio_url: 'https://example.com/sample-audio.mp3',
      thumbnail_url: 'https://picsum.photos/seed/music/400/300',
      author_id: 'system',
      access_tier_id: premiumTierId
    },
    {
      title: 'Kultūros pažinimo užduotys',
      description: 'Edukacinės užduotys apie lietuvių liaudies tradicijas',
      type: 'lesson_plan' as const,
      published: true,
      document_url: 'https://example.com/sample-doc.pdf',
      thumbnail_url: 'https://picsum.photos/seed/culture/400/300',
      author_id: 'system',
      access_tier_id: premiumTierId
    },
    {
      title: 'Ritmo žaidimas',
      description: 'Interaktyvus žaidimas ritmo pojūčiui lavinti',
      type: 'game' as const,
      published: true,
      game_assets_url: 'https://example.com/game-assets.zip',
      thumbnail_url: 'https://picsum.photos/seed/game/400/300',
      author_id: 'system',
      access_tier_id: freeTierId
    }
  ]

  // Insert content items first
  const { data: contentItems, error: contentError } = await client
    .from('content_items')
    .insert(sampleContents)
    .select()

  if (contentError) throw contentError

  // Prepare age group and category relationships
  const ageGroupRelations = contentItems.flatMap(content => [
    {
      content_id: content.id,
      age_group_id: ageGroups[Math.floor(Math.random() * ageGroups.length)].id
    },
    {
      content_id: content.id,
      age_group_id: ageGroups[Math.floor(Math.random() * ageGroups.length)].id
    }
  ])

  const categoryRelations = contentItems.flatMap(content => [
    {
      content_id: content.id,
      category_id: categories[Math.floor(Math.random() * categories.length)].id
    },
    {
      content_id: content.id,
      category_id: categories[Math.floor(Math.random() * categories.length)].id
    }
  ])

  // Insert relationships
  const [{ error: ageGroupError }, { error: categoryError }] = await Promise.all([
    client.from('content_age_groups').insert(ageGroupRelations),
    client.from('content_categories').insert(categoryRelations)
  ])

  if (ageGroupError) throw ageGroupError
  if (categoryError) throw categoryError

  return contentItems
}

export async function createContent(data: ContentFormData): Promise<ContentItem> {
  try {
    // Validate required fields
    if (!data.title || !data.type) {
      throw new Error('Title and type are required')
    }

    // Start a transaction
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Authentication required')
    }

    // Upload thumbnail if provided
    let thumbnailUrl = null
    if (data.thumbnail instanceof File) {
      // Upload the thumbnail
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(`${Date.now()}-${data.thumbnail.name}`, data.thumbnail)

      if (uploadError) {
        throw new Error(`Failed to upload thumbnail: ${uploadError.message}`)
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(uploadData.path)

      thumbnailUrl = publicUrl
    } else if (typeof data.thumbnail === 'string' && data.thumbnail) {
      // If thumbnail is already a URL string, use it directly
      thumbnailUrl = data.thumbnail
    }

    // Generate a slug from the title
    const slug = slugify(data.title, { lower: true, strict: true })

    // Prepare content data
    const content = {
      title: data.title,
      description: data.description || '',
      type: data.type,
      content_body: data.contentBody || '',
      slug,
      thumbnail_url: thumbnailUrl,
      published: data.published,
      created_by: session.user.id,
    }

    // Insert content
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .insert(content)
      .select('*')
      .single()

    if (contentError) {
      throw new Error(`Failed to create content: ${contentError.message}`)
    }

    // Create relationships for age groups
    if (data.ageGroups && data.ageGroups.length > 0) {
      const ageGroupRelations = data.ageGroups.map(ageGroupId => ({
        content_id: contentItem.id,
        age_group_id: ageGroupId
      }))

      const { error: ageGroupError } = await supabase
        .from('content_age_groups')
        .insert(ageGroupRelations)

      if (ageGroupError) {
        throw new Error(`Failed to associate age groups: ${ageGroupError.message}`)
      }
    }

    // Create relationships for categories
    if (data.categories && data.categories.length > 0) {
      const categoryRelations = data.categories.map(categoryId => ({
        content_id: contentItem.id,
        category_id: categoryId
      }))

      const { error: categoryError } = await supabase
        .from('content_categories')
        .insert(categoryRelations)

      if (categoryError) {
        throw new Error(`Failed to associate categories: ${categoryError.message}`)
      }
    }

    // Associate with access tier
    if (data.accessTierId) {
      const { error: accessTierError } = await supabase
        .from('content_access_tiers')
        .insert({
          content_id: contentItem.id,
          access_tier_id: data.accessTierId
        })

      if (accessTierError) {
        throw new Error(`Failed to associate access tier: ${accessTierError.message}`)
      }
    }

    return contentItem
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unknown error occurred while creating content')
  }
}

export async function getContentById(id: string, adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  const { data, error } = await client
    .from('content_items')
    .select(`
      *,
      access_tier:access_tiers!content_items_access_tier_id_fkey(*),
      age_groups:content_age_groups(
        age_group:age_groups(*)
      ),
      categories:content_categories(
        category:categories(*)
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    throw error
  }

  // Transform the data to match the expected format
  return {
    ...data,
    age_groups: data.age_groups?.map((ag: any) => ag.age_group) || [],
    categories: data.categories?.map((cc: any) => cc.category) || [],
    access_tier: {
      id: data.access_tier_id,
      name: data.access_tier?.name || 'free',
      level: data.access_tier?.level || 0,
      features: data.access_tier?.features || {}
    }
  }
}

export async function getContentBySlug(slug: string, adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  const { data, error } = await client
    .from('content_items')
    .select(`
      *,
      access_tier:access_tiers!content_items_access_tier_id_fkey(*),
      age_groups:content_age_groups(
        age_group:age_groups(*)
      ),
      categories:content_categories(
        category:categories(*)
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) throw error
  if (!data) throw new Error('Content not found')

  // Transform the data to match the expected format
  return {
    ...data,
    age_groups: data.age_groups?.map((ag: any) => ag.age_group) || [],
    categories: data.categories?.map((cc: any) => cc.category) || [],
    access_tier: {
      id: data.access_tier_id,
      name: data.access_tier?.name || 'free',
      level: data.access_tier?.level || 0,
      features: data.access_tier?.features || {}
    }
  }
}

export async function getFeedback(contentId: string) {
  try {
    const { data, error } = await supabase
      .from('content_feedback')
      .select('*')
      .eq('content_id', contentId)

    if (error) throw error
    return data || []
  } catch (error) {
    throw error
  }
}

export async function addFeedback(contentId: string, rating: number, comment?: string) {
  try {
    const feedback = {
      content_id: contentId,
      rating,
      comment,
      user_id: 'anonymous'
    }

    const { data, error } = await supabase
      .from('content_feedback')
      .insert(feedback)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

export async function checkFeedback(contentId: string) {
  try {
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('content_feedback')
      .select('*')
      .eq('content_id', contentId)

    if (feedbackError) throw feedbackError

    return {
      hasGivenFeedback: false,
      feedbackCount: feedbackData?.length || 0
    }
  } catch (error) {
    throw error
  }
} 