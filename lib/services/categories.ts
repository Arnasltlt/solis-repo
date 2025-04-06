import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { 
  Category,
  // We'll rely on API route responses now, not these specific types
  // CreateCategoryResponse, 
  // DeleteCategoryResponse, 
  // GetCategoryUsageResponse 
} from '@/lib/types/categories'

// Standard client for public reads (used by getCategories)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Get all categories (intended for client-side or server-side read)
 * Uses standard client which respects public read RLS.
 */
export async function getCategories(): Promise<Category[]> {
  // Note: No adminClient needed here, using the standard client
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  return data as Category[]
}

/**
 * Create a new category (intended for server-side use via API route)
 * Requires admin client passed in.
 */
export async function createCategoryOnServer(
  client: SupabaseClient, // Expecting admin client
  name: string, 
  description?: string
): Promise<{ data: Category | null, error: Error | null }> {
  
  // Check if category with this name already exists
  const { data: existingCategories, error: checkError } = await client
    .from('categories')
    .select('id')
    .eq('name', name)
    .limit(1)

  if (checkError) {
    console.error('Error checking for existing category:', checkError)
    return { data: null, error: new Error('Nepavyko patikrinti esamos kategorijos') }
  }
  
  if (existingCategories && existingCategories.length > 0) {
    return { data: null, error: new Error('Kategorija su tokiu pavadinimu jau egzistuoja') }
  }
  
  // Create new category
  const { data, error } = await client
    .from('categories')
    .insert([{ name: name.trim(), description: description?.trim() || null }])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating category directly:', error)
    return { data: null, error: new Error('Nepavyko sukurti kategorijos') }
  }
  
  return { data: data as Category, error: null }
}

/**
 * Get usage count of a category (intended for server-side use via API route)
 * Requires admin client passed in to potentially bypass RLS if needed, though count might work with standard select RLS.
 */
export async function getCategoryUsageOnServer(
  client: SupabaseClient, // Expecting admin client
  categoryId: string
): Promise<{ count: number | null, error: Error | null }> {

  const { count, error } = await client
    .from('content_categories')
    .select('*', { count: 'exact' }) // Remove head: true flag to use GET count method
    .eq('category_id', categoryId)
  
  if (error) {
    console.error('Error getting category usage directly:', error);
    return { count: null, error: new Error('Nepavyko gauti kategorijos naudojimo informacijos') }
  }
  
  return { count: count ?? 0, error: null }
}

/**
 * Delete a category (intended for server-side use via API route)
 * Requires admin client passed in.
 * IMPORTANT: This deletes the category AND its links in content_categories.
 */
export async function deleteCategoryOnServer(
  client: SupabaseClient, // Expecting admin client
  categoryId: string
): Promise<{ success: boolean, error: Error | null }> {
  
  // Supabase transactions are recommended for multi-step operations
  // However, for simplicity here, we perform sequentially. Consider transactions for production.

  // 1. Remove links from content_categories
  const { error: removeError } = await client
    .from('content_categories')
    .delete()
    .eq('category_id', categoryId)
  
  if (removeError) {
    console.error('Error removing category links directly:', removeError)
    return { success: false, error: new Error('Nepavyko pašalinti kategorijos sąsajų') }
  }
  
  // 2. Delete the category itself
  const { error: deleteError } = await client
    .from('categories')
    .delete()
    .eq('id', categoryId)
  
  if (deleteError) {
    console.error('Error deleting category directly:', deleteError)
    return { success: false, error: new Error('Nepavyko ištrinti kategorijos') }
  }
  
  return { success: true, error: null }
}

/**
 * Update a category (intended for server-side use via API route)
 * Requires admin client passed in.
 */
export async function updateCategoryOnServer(
  client: SupabaseClient, // Expecting admin client
  categoryId: string,
  name: string,
  description?: string
): Promise<{ data: Category | null, error: Error | null }> {

  // Check if another category with the same name exists
  const { data: existingCategories, error: checkError } = await client
    .from('categories')
    .select('id')
    .eq('name', name)
    .neq('id', categoryId) // Exclude the category being updated
    .limit(1)

  if (checkError) {
    console.error('Error checking for existing category name on update:', checkError)
    return { data: null, error: new Error('Nepavyko patikrinti esamo kategorijos pavadinimo') }
  }
  
  if (existingCategories && existingCategories.length > 0) {
    return { data: null, error: new Error('Kategorija su tokiu pavadinimu jau egzistuoja') }
  }

  // Update the category
  const { data, error } = await client
    .from('categories')
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    console.error('Error updating category directly:', error)
    return { data: null, error: new Error('Nepavyko atnaujinti kategorijos') }
  }
  
  return { data: data as Category, error: null }
} 