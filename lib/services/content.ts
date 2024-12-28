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
      age_groups:content_age_groups(
        age_group:age_groups(*)
      ),
      categories:content_categories(
        category:categories(*)
      ),
      access_tier:access_tiers(*)
    `)
    .eq('published', true)

  if (ageGroup) {
    query = query.eq('content_age_groups.age_group_id', ageGroup)
  }

  if (categories && categories.length > 0) {
    query = query.in('content_categories.category_id', categories)
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  console.log('Fetching content with query:', query) // Debug log

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching content:', error) // Debug log
    throw error
  }

  console.log('Content fetch successful:', data) // Debug log

  // Transform the data to match the expected format
  return data.map(item => ({
    ...item,
    age_groups: item.age_groups.map((ag: any) => ag.age_group),
    categories: item.categories.map((cc: any) => cc.category),
    access_tier: item.access_tier // Don't need to access [0] since it's already a single object
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
  const freeTierId = accessTiers.find(tier => tier.name === 'free')?.id
  const premiumTierId = accessTiers.find(tier => tier.name === 'premium')?.id

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
  type: ContentType | null
  title: string
  description: string
  ageGroups: string[]
  categories: string[]
  thumbnail: File | null
  contentBody: string
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

  // Insert the content item
  const { data: contentItem, error: contentError } = await client
    .from('content_items')
    .insert({
      title,
      description,
      type,
      thumbnail_url: thumbnailUrl,
      content_body: contentBody,
      access_tier_id: accessTierId,
      published,
      author_id: session.user.id
    })
    .select()
    .single()

  if (contentError) throw contentError

  // Prepare age group and category relationships
  const ageGroupRelations = ageGroups.map(ageGroupId => ({
    content_id: contentItem.id,
    age_group_id: ageGroupId
  }))

  const categoryRelations = categories.map(categoryId => ({
    content_id: contentItem.id,
    category_id: categoryId
  }))

  // Insert relationships
  const [{ error: ageGroupError }, { error: categoryError }] = await Promise.all([
    client.from('content_age_groups').insert(ageGroupRelations),
    client.from('content_categories').insert(categoryRelations)
  ])

  if (ageGroupError) throw ageGroupError
  if (categoryError) throw categoryError

  return contentItem
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