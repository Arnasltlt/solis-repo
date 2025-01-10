import { supabase } from '@/lib/supabase/client'
import { uploadMedia } from '@/lib/services/storage'
import type { ContentType } from '@/lib/types/content'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper function to get the appropriate client
function getClient(adminClient?: SupabaseClient) {
  return adminClient || supabase
}

export async function getAgeGroups(adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  const { data, error } = await client
    .from('age_groups')
    .select('*')
    .order('range')
  
  if (error) throw error
  return data
}

export async function getCategories(adminClient?: SupabaseClient) {
  const client = getClient(adminClient)
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
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
  ageGroup,
  categories,
  searchQuery,
  adminClient
}: {
  ageGroup?: string
  categories?: string[]
  searchQuery?: string
  adminClient?: SupabaseClient
} = {}) {
  const client = getClient(adminClient)
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

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching content:', error)
    throw error
  }

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
  
  // Check if we're authenticated
  const { data: { session }, error: authError } = await client.auth.getSession()
  if (!session?.user) {
    throw new Error('Must be authenticated to insert content')
  }

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
      author_id: session.user.id,
      access_tier_id: freeTierId
    },
    {
      title: 'Muzikos ritmo pamoka',
      description: 'Interaktyvi muzikos pamoka mažiesiems',
      type: 'audio' as const,
      published: true,
      audio_url: 'https://example.com/sample-audio.mp3',
      thumbnail_url: 'https://picsum.photos/seed/music/400/300',
      author_id: session.user.id,
      access_tier_id: premiumTierId
    },
    {
      title: 'Kultūros pažinimo užduotys',
      description: 'Edukacinės užduotys apie lietuvių liaudies tradicijas',
      type: 'lesson_plan' as const,
      published: true,
      document_url: 'https://example.com/sample-doc.pdf',
      thumbnail_url: 'https://picsum.photos/seed/culture/400/300',
      author_id: session.user.id,
      access_tier_id: premiumTierId
    },
    {
      title: 'Ritmo žaidimas',
      description: 'Interaktyvus žaidimas ritmo pojūčiui lavinti',
      type: 'game' as const,
      published: true,
      game_assets_url: 'https://example.com/game-assets.zip',
      thumbnail_url: 'https://picsum.photos/seed/game/400/300',
      author_id: session.user.id,
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

export async function createContent({
  type,
  title,
  description,
  ageGroups,
  categories,
  thumbnail,
  contentBody,
  accessTierId,
  published = false,
  adminClient
}: {
  type: ContentType
  title: string
  description?: string
  ageGroups: string[]
  categories: string[]
  thumbnail: File | null
  contentBody?: string
  accessTierId: string
  published?: boolean
  adminClient?: SupabaseClient
}) {
  const client = getClient(adminClient)
  
  const { data: { session }, error: authError } = await client.auth.getSession()
  if (!session?.user) {
    throw new Error('Must be authenticated to create content')
  }

  // Upload the thumbnail if provided
  let thumbnailUrl = null
  if (thumbnail) {
    const { url, error } = await uploadMedia(thumbnail, 'thumbnail', { generateUniqueName: true })
    if (error) throw error
    thumbnailUrl = url
  }

  // Create the content item
  const { data: content, error: contentError } = await client
    .from('content_items')
    .insert({
      type,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      content_body: contentBody,
      access_tier_id: accessTierId,
      published,
      author_id: session.user.id
    })
    .select()
    .single()

  if (contentError) throw contentError

  // Create age group relationships
  const ageGroupRelations = ageGroups.map(groupId => ({
    content_id: content.id,
    age_group_id: groupId
  }))

  const { error: ageGroupError } = await client
    .from('content_age_groups')
    .insert(ageGroupRelations)

  if (ageGroupError) throw ageGroupError

  // Create category relationships
  const categoryRelations = categories.map(categoryId => ({
    content_id: content.id,
    category_id: categoryId
  }))

  const { error: categoryError } = await client
    .from('content_categories')
    .insert(categoryRelations)

  if (categoryError) throw categoryError

  return content
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
    console.error('Error fetching content:', error)
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