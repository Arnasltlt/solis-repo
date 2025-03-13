import type { ContentType } from '@/lib/types/content'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { Database, ContentItem } from '@/lib/types/database'
import slugify from 'slugify'
import { v4 as uuidv4 } from 'uuid'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { uploadThumbnail } from '@/lib/utils/storage-utils'
import { createFileCopy } from '@/lib/utils/debug-utils'

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
    return []
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

async function getPremiumTierId(client: SupabaseClient) {
  const { data, error } = await client
    .from('access_tiers')
    .select('id')
    .eq('name', 'premium')
    .single()
  
  if (error) {
    console.error('Error fetching premium tier ID:', error)
    return null
  }
  
  return data?.id
}

export async function getContentItems({
  ageGroups,
  categories,
  searchQuery,
  adminClient,
  showPremiumOnly = false
}: {
  ageGroups?: string[]
  categories?: string[]
  searchQuery?: string
  adminClient?: SupabaseClient
  showPremiumOnly?: boolean
} = {}) {
  const client = getClient(adminClient)
  console.log('DEBUG - Fetching content items with filters:', { ageGroups, categories, searchQuery, showPremiumOnly })
  
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

  // Apply premium filter if requested
  if (showPremiumOnly) {
    const premiumTierId = await getPremiumTierId(client)
    if (premiumTierId) {
      query = query.eq('access_tier_id', premiumTierId)
    }
  }

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

export async function createContent(
  data: ContentFormData,
  supabase: SupabaseClient<Database>
): Promise<ContentItem> {
  // Validate required fields
  if (!data.title || !data.type) {
    throw new Error('Title and type are required')
  }

  try {
    // Get the current user's ID
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user?.id) {
      throw new Error('User must be authenticated to create content')
    }

    // Prepare the request payload for content_items table
    const slug = slugify(data.title, { lower: true, strict: true });
    
    // Create a unique slug to avoid conflicts
    const timestamp = new Date().getTime();
    const uniqueSlug = `${slug}-${timestamp.toString().slice(-6)}`;
    
    const payload = {
      title: data.title,
      description: data.description || '',
      type: data.type,
      content_body: data.contentBody || '',
      published: data.published,
      access_tier_id: data.accessTierId,
      thumbnail_url: '',
      author_id: session.session.user.id,
      // Use unique slug to avoid conflicts
      slug: uniqueSlug
    }

    // Debug the content body
    console.log('createContent payload:', {
      contentBodyProvided: !!data.contentBody,
      contentBodyType: typeof data.contentBody,
      contentBodyLength: data.contentBody?.length || 0,
      finalContentBody: payload.content_body.substring(0, 100), // First 100 chars
      hasThumbnail: !!data.thumbnail,
      thumbnailType: data.thumbnail ? typeof data.thumbnail : 'none',
      thumbnailIsFile: data.thumbnail instanceof File,
      thumbnailDetails: data.thumbnail instanceof File ? {
        name: data.thumbnail.name,
        size: data.thumbnail.size,
        type: data.thumbnail.type
      } : 'not a file'
    });

    // Handle thumbnail upload if provided
    if (data.thumbnail instanceof File) {
      try {
        console.log('Uploading thumbnail file:', {
          name: data.thumbnail.name,
          size: data.thumbnail.size,
          type: data.thumbnail.type,
          lastModified: new Date(data.thumbnail.lastModified).toISOString()
        });
        
        // Validate file before upload
        if (data.thumbnail.size === 0) {
          throw new Error('Cannot upload empty file');
        }
        
        if (!data.thumbnail.type.startsWith('image/')) {
          throw new Error('Thumbnail must be an image file');
        }
        
        // Create a unique filename
        const fileExt = data.thumbnail.name.split('.').pop() || 'jpg';
        const uniqueFileName = `content-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        
        // Use our utility to create a proper file copy
        console.log('Creating file copy...');
        const copyResult = await createFileCopy(data.thumbnail, uniqueFileName);
        
        if (!copyResult.success || !copyResult.file) {
          console.error('Failed to create file copy:', copyResult.error);
          throw new Error(`Failed to create file copy: ${copyResult.error}`);
        }
        
        console.log('File copy created successfully using method:', copyResult.method);
        console.log('File copy details:', copyResult.details);
        
        // Upload the file copy
        console.log('Uploading file copy...');
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(copyResult.file.name, copyResult.file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(uploadData.path);
        
        console.log('Public URL obtained:', publicUrl);
        payload.thumbnail_url = publicUrl;
      } catch (error) {
        console.error('Error uploading thumbnail:', error);
        // Continue without thumbnail if upload fails
        payload.thumbnail_url = 'https://placehold.co/600x400/png?text=No+Thumbnail';
      }
    } else if (typeof data.thumbnail === 'string' && data.thumbnail.trim() !== '') {
      // If thumbnail is already a URL string, use it directly
      console.log('Using provided thumbnail URL:', data.thumbnail);
      payload.thumbnail_url = data.thumbnail;
    } else {
      console.log('No thumbnail file provided, using default');
      // Use default thumbnail if none provided
      payload.thumbnail_url = 'https://placehold.co/600x400/png?text=No+Thumbnail';
    }

    // Insert the content item
    const { data: contentItem, error: contentError } = await supabase
      .from('content_items')
      .insert(payload)
      .select('*')
      .single()

    if (contentError) throw contentError

    // Insert age group relationships
    if (data.ageGroups && data.ageGroups.length > 0) {
      const ageGroupRelations = data.ageGroups.map(ageGroupId => ({
        content_id: contentItem.id,
        age_group_id: ageGroupId
      }))

      const { error: ageGroupError } = await supabase
        .from('content_age_groups')
        .insert(ageGroupRelations)

      if (ageGroupError) {
        console.error('Error inserting age groups:', ageGroupError)
        // Don't throw, continue with other operations
      }
    }

    // Insert category relationships
    if (data.categories && data.categories.length > 0) {
      const categoryRelations = data.categories.map(categoryId => ({
        content_id: contentItem.id,
        category_id: categoryId
      }))

      const { error: categoryError } = await supabase
        .from('content_categories')
        .insert(categoryRelations)

      if (categoryError) {
        console.error('Error inserting categories:', categoryError)
        // Don't throw, continue with other operations
      }
    }

    // Return the created content item
    return contentItem
  } catch (error) {
    console.error('Error creating content:', error)
    throw error
  }
}

export async function getContentById(id: string, adminClient?: SupabaseClient) {
  console.log('Getting content by ID:', id);
  
  try {
    const client = getClient(adminClient);
    
    // First, check if the content exists
    const { data: contentExists, error: existsError } = await client
      .from('content_items')
      .select('id')
      .eq('id', id)
      .single();
    
    if (existsError) {
      console.error('Error checking if content exists:', existsError);
      if (existsError.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        console.log('Content not found with ID:', id);
        return null;
      }
      throw existsError;
    }
    
    if (!contentExists) {
      console.log('Content not found with ID:', id);
      return null;
    }
    
    // If content exists, get the full data
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
      .single();
    
    if (error) {
      console.error('Error fetching content data:', error);
      throw error;
    }
    
    if (!data) {
      console.log('No data returned for content ID:', id);
      return null;
    }
    
    console.log('Content retrieved successfully for ID:', id);
    
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
    };
  } catch (error) {
    console.error('Error in getContentById:', error);
    throw error;
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

export async function updateContent(
  id: string,
  data: Partial<ContentFormData>,
  supabase: SupabaseClient<Database>
): Promise<ContentItem> {
  if (!id) {
    throw new Error('Content ID is required')
  }

  try {
    // Get the current user's ID and subscription tier
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session?.user?.id) {
      throw new Error('User must be authenticated to update content')
    }

    // Get the user's subscription tier
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier_id')
      .eq('id', session.session.user.id)
      .single()

    if (userError) throw userError

    // Get the administrator tier ID
    const { data: adminTier, error: adminTierError } = await supabase
      .from('access_tiers')
      .select('id')
      .eq('name', 'administrator')
      .single()

    if (adminTierError) throw adminTierError

    // Check if user is an administrator
    const isAdmin = userData?.subscription_tier_id === adminTier.id

    if (!isAdmin) {
      // If not admin, verify the user owns this content
      const { data: existingContent, error: fetchError } = await supabase
        .from('content_items')
        .select('author_id')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      if (!existingContent) throw new Error('Content not found')
      if (existingContent.author_id !== session.session.user.id) {
        throw new Error('You do not have permission to update this content')
      }
    }

    // Prepare the update payload
    const payload: any = {}
    
    // Only include fields that are provided in the update
    if (data.title !== undefined) payload.title = data.title
    if (data.description !== undefined) payload.description = data.description
    if (data.type !== undefined) payload.type = data.type
    if (data.published !== undefined) payload.published = data.published
    if (data.accessTierId !== undefined) payload.access_tier_id = data.accessTierId
    
    // Special handling for content_body to ensure it's properly updated
    if (data.contentBody !== undefined) {
      // Don't save the literal string "content_body"
      if (data.contentBody === 'content_body') {
        console.log('Ignoring literal "content_body" string in update');
        // Don't update content_body if it's the literal string "content_body"
      } else {
        payload.content_body = data.contentBody;
        console.log('Setting content_body in update payload:', {
          contentBodyProvided: true,
          contentBodyType: typeof data.contentBody,
          contentBodyLength: data.contentBody?.length || 0,
          contentBodySample: data.contentBody?.substring(0, 100) || ''
        });
      }
    } else {
      console.log('content_body not provided in update data');
    }

    // Debug the full update payload
    console.log('Full updateContent payload:', {
      id,
      payloadKeys: Object.keys(payload),
      hasContentBody: 'content_body' in payload
    });

    // If title is updated, update the slug with a unique value
    if (data.title) {
      const slug = slugify(data.title, { lower: true, strict: true });
      const timestamp = new Date().getTime();
      payload.slug = `${slug}-${timestamp.toString().slice(-6)}`;
    }

    // Handle thumbnail update if provided
    if (data.thumbnail) {
      console.log('Using provided thumbnail:', data.thumbnail);
      payload.thumbnail_url = data.thumbnail;
    }

    // Update the content item
    const { data: updatedContent, error: updateError } = await supabase
      .from('content_items')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) throw updateError

    // Update age group relationships if provided
    if (data.ageGroups) {
      // First delete existing relationships
      await supabase
        .from('content_age_groups')
        .delete()
        .eq('content_id', id)

      // Then insert new relationships
      if (data.ageGroups.length > 0) {
        const ageGroupRelations = data.ageGroups.map(ageGroupId => ({
          content_id: id,
          age_group_id: ageGroupId
        }))

        const { error: ageGroupError } = await supabase
          .from('content_age_groups')
          .insert(ageGroupRelations)

        if (ageGroupError) {
          console.error('Error updating age groups:', ageGroupError)
        }
      }
    }

    // Update category relationships if provided
    if (data.categories) {
      // First delete existing relationships
      await supabase
        .from('content_categories')
        .delete()
        .eq('content_id', id)

      // Then insert new relationships
      if (data.categories.length > 0) {
        const categoryRelations = data.categories.map(categoryId => ({
          content_id: id,
          category_id: categoryId
        }))

        const { error: categoryError } = await supabase
          .from('content_categories')
          .insert(categoryRelations)

        if (categoryError) {
          console.error('Error updating categories:', categoryError)
        }
      }
    }

    return updatedContent
  } catch (error) {
    console.error('Error updating content:', error)
    throw error
  }
}

/**
 * Updates only the content body of a content item
 * This is a simplified version of updateContent that only updates the content_body field
 */
export async function updateContentBody(
  id: string,
  contentBody: string,
  adminClient?: SupabaseClient
) {
  console.log('Updating content body for content ID:', id);
  
  try {
    const client = getClient(adminClient);
    
    // First, check if the content exists
    const { data: contentExists, error: existsError } = await client
      .from('content_items')
      .select('id')
      .eq('id', id)
      .single();
    
    if (existsError) {
      console.error('Error checking if content exists:', existsError);
      if (existsError.code === 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        throw new Error(`Content not found with ID: ${id}`);
      }
      throw existsError;
    }
    
    if (!contentExists) {
      throw new Error(`Content not found with ID: ${id}`);
    }
    
    // Ensure contentBody is a string
    const safeContentBody = contentBody || '';
    
    console.log('Content body length:', safeContentBody.length);
    console.log('Content body preview:', safeContentBody.substring(0, 100) + '...');
    
    // Update the content body
    const { data, error } = await client
      .from('content_items')
      .update({
        content_body: safeContentBody,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating content body:', error);
      throw new Error(`Failed to update content body: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.error('No data returned after update');
      throw new Error('Failed to update content body: No data returned');
    }
    
    console.log('Content body updated successfully');
    return data[0];
  } catch (error) {
    console.error('Error in updateContentBody:', error);
    throw error;
  }
} 