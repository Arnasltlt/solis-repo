import { supabase } from '@/lib/supabase/client'

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
      age_groups!inner(id, range),
      categories!inner(id, name)
    `)
    .eq('published', true)

  if (ageGroup) {
    query = query.eq('age_group', ageGroup)
  }

  if (categories && categories.length > 0) {
    query = query.in('category', categories)
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error

  // Transform the data to match the expected format
  return data.map(item => ({
    ...item,
    age_group: item.age_groups,
    category: item.categories
  }))
}

// Insert sample content items for testing
export async function insertSampleContent() {
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
      age_group: ageGroups[1].id, // 4-6 metai
      category: categories[0].id,  // Šokis-Baletas
      type: 'video' as const,
      published: true,
      vimeo_id: '123456789',
      thumbnail_url: 'https://picsum.photos/seed/dance/400/300',
      author_id: '00000000-0000-0000-0000-000000000000'
    },
    {
      title: 'Muzikos ritmo pamoka',
      description: 'Interaktyvi muzikos pamoka mažiesiems',
      age_group: ageGroups[0].id, // 2-4 metai
      category: categories[1].id,  // Muzika-Dainos
      type: 'audio' as const,
      published: true,
      audio_url: 'https://example.com/sample-audio.mp3',
      thumbnail_url: 'https://picsum.photos/seed/music/400/300',
      author_id: '00000000-0000-0000-0000-000000000000'
    },
    {
      title: 'Kultūros pažinimo užduotys',
      description: 'Edukacinės užduotys apie lietuvių liaudies tradicijas',
      age_group: ageGroups[2].id, // 6+ metai
      category: categories[2].id,  // Pamokų planai
      type: 'lesson_plan' as const,
      published: true,
      document_url: 'https://example.com/sample-doc.pdf',
      thumbnail_url: 'https://picsum.photos/seed/culture/400/300',
      author_id: '00000000-0000-0000-0000-000000000000'
    },
    {
      title: 'Ritmo žaidimas',
      description: 'Interaktyvus žaidimas ritmo pojūčiui lavinti',
      age_group: ageGroups[1].id, // 4-6 metai
      category: categories[3].id,  // Muzika-Ritmo žaidimai
      type: 'game' as const,
      published: true,
      game_assets_url: 'https://example.com/game-assets.zip',
      thumbnail_url: 'https://picsum.photos/seed/game/400/300',
      author_id: '00000000-0000-0000-0000-000000000000'
    }
  ]

  const { data, error } = await supabase
    .from('content_items')
    .insert(sampleContents)
    .select()

  if (error) throw error
  return data
} 