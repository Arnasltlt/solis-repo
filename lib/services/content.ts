import { supabase } from '@/lib/supabase/client'
import { uploadMedia } from '@/lib/services/storage'

export async function getAgeGroups() {
  const { data, error } = await supabase
    .from('age_groups')
    .select('*')
    .order('range')
  
  if (error) throw error
  return data
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getContentItems({
  ageGroup,
  categories,
  searchQuery
}: {
  ageGroup?: string
  categories?: string[]
  searchQuery?: string
} = {}) {
  let query = supabase
    .from('content_items')
    .select(`
      *,
      age_groups:content_age_groups(
        age_group:age_groups(*)
      ),
      categories:content_categories(
        category:categories(*)
      )
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

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error

  // Transform the data to match the expected format
  return data.map(item => ({
    ...item,
    age_groups: item.age_groups.map((ag: any) => ag.age_group),
    categories: item.categories.map((cc: any) => cc.category)
  }))
}

// Insert sample content items for testing
export async function insertSampleContent() {
  // Check if we're authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (!session?.user) {
    throw new Error('Must be authenticated to insert content')
  }

  // First get an age group and category
  const [ageGroups, categories] = await Promise.all([
    getAgeGroups(),
    getCategories()
  ])

  if (!ageGroups.length || !categories.length) {
    throw new Error('No age groups or categories found')
  }

  const sampleContents = [
    {
      title: 'Pavasario šokis',
      description: 'Linksmas šokis vaikams, švenčiantis pavasario atėjimą',
      type: 'video' as const,
      published: true,
      vimeo_id: '123456789',
      thumbnail_url: 'https://picsum.photos/seed/dance/400/300',
      author_id: session.user.id
    },
    {
      title: 'Muzikos ritmo pamoka',
      description: 'Interaktyvi muzikos pamoka mažiesiems',
      type: 'audio' as const,
      published: true,
      audio_url: 'https://example.com/sample-audio.mp3',
      thumbnail_url: 'https://picsum.photos/seed/music/400/300',
      author_id: session.user.id
    },
    {
      title: 'Kultūros pažinimo užduotys',
      description: 'Edukacinės užduotys apie lietuvių liaudies tradicijas',
      type: 'lesson_plan' as const,
      published: true,
      document_url: 'https://example.com/sample-doc.pdf',
      thumbnail_url: 'https://picsum.photos/seed/culture/400/300',
      author_id: session.user.id
    },
    {
      title: 'Ritmo žaidimas',
      description: 'Interaktyvus žaidimas ritmo pojūčiui lavinti',
      type: 'game' as const,
      published: true,
      game_assets_url: 'https://example.com/game-assets.zip',
      thumbnail_url: 'https://picsum.photos/seed/game/400/300',
      author_id: session.user.id
    }
  ]

  // Insert content items first
  const { data: contentItems, error: contentError } = await supabase
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
    supabase.from('content_age_groups').insert(ageGroupRelations),
    supabase.from('content_categories').insert(categoryRelations)
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
  vimeoId,
  audioFile,
  documentFile,
  gameFiles,
  published = false
}: {
  type: 'video' | 'audio' | 'lesson_plan' | 'game'
  title: string
  description: string
  ageGroups: string[]
  categories: string[]
  thumbnail: File | null
  vimeoId?: string
  audioFile?: File
  documentFile?: File
  gameFiles?: File[]
  published?: boolean
}) {
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (!session?.user) {
    throw new Error('Must be authenticated to create content')
  }

  // First upload the thumbnail if provided
  let thumbnailUrl = null
  if (thumbnail) {
    const { url, error } = await uploadMedia(thumbnail, 'thumbnail', { generateUniqueName: true })
    if (error) throw error
    thumbnailUrl = url
  }

  // Upload type-specific files
  let audioUrl = null, documentUrl = null, gameAssetsUrl = null
  
  if (type === 'audio' && audioFile) {
    const { url, error } = await uploadMedia(audioFile, 'audio', { generateUniqueName: true })
    if (error) throw error
    audioUrl = url
  }

  if (type === 'lesson_plan' && documentFile) {
    const { url, error } = await uploadMedia(documentFile, 'document', { generateUniqueName: true })
    if (error) throw error
    documentUrl = url
  }

  if (type === 'game' && gameFiles?.length) {
    // For now, just handle the first game file
    const { url, error } = await uploadMedia(gameFiles[0], 'game', { generateUniqueName: true })
    if (error) throw error
    gameAssetsUrl = url
  }

  // Insert the content item
  const { data: contentItem, error: contentError } = await supabase
    .from('content_items')
    .insert({
      title,
      description,
      type,
      thumbnail_url: thumbnailUrl,
      vimeo_id: vimeoId,
      audio_url: audioUrl,
      document_url: documentUrl,
      game_assets_url: gameAssetsUrl,
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
    supabase.from('content_age_groups').insert(ageGroupRelations),
    supabase.from('content_categories').insert(categoryRelations)
  ])

  if (ageGroupError) throw ageGroupError
  if (categoryError) throw categoryError

  return contentItem
} 