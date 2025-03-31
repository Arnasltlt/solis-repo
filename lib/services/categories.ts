import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { 
  Category, 
  CreateCategoryResponse, 
  DeleteCategoryResponse, 
  GetCategoryUsageResponse 
} from '@/lib/types/categories'

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper function to get the appropriate client
function getClient(adminClient?: SupabaseClient) {
  return adminClient || supabase
}

/**
 * Get all categories
 */
export async function getCategories(adminClient?: SupabaseClient): Promise<Category[]> {
  const client = getClient(adminClient)
  
  const { data, error } = await client
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
 * Create a new category
 */
export async function createCategory(name: string, adminClient?: SupabaseClient): Promise<CreateCategoryResponse> {
  try {
    const client = getClient(adminClient)
    
    // Check if category with this name already exists
    const { data: existingCategories } = await client
      .from('categories')
      .select('*')
      .eq('name', name)
      .limit(1)
    
    if (existingCategories && existingCategories.length > 0) {
      return {
        success: false,
        error: 'Kategorija su tokiu pavadinimu jau egzistuoja'
      }
    }
    
    // Create new category
    const { data, error } = await client
      .from('categories')
      .insert([{ name }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating category:', error)
      return {
        success: false,
        error: 'Nepavyko sukurti kategorijos'
      }
    }
    
    return {
      success: true,
      category: data as Category
    }
  } catch (error) {
    console.error('Error in createCategory:', error)
    return {
      success: false,
      error: 'Įvyko klaida kuriant kategoriją'
    }
  }
}

/**
 * Get usage count of a category
 */
export async function getCategoryUsage(categoryId: string, adminClient?: SupabaseClient): Promise<GetCategoryUsageResponse> {
  try {
    const client = getClient(adminClient)
    
    // Correctly count content items that use this category using .count()
    const { count, error } = await client
      .from('content_categories')
      .select('', { count: 'exact', head: false }) // Select nothing, just count
      .eq('category_id', categoryId)
    
    if (error) {
      console.error('Error getting category usage:', error)
      return {
        success: false,
        error: 'Nepavyko gauti kategorijos naudojimo informacijos'
      }
    }
    
    return {
      success: true,
      usage: { count: count || 0 }
    }
  } catch (error) {
    console.error('Error in getCategoryUsage:', error)
    return {
      success: false,
      error: 'Įvyko klaida gaunant kategorijos naudojimo informaciją'
    }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string, adminClient?: SupabaseClient): Promise<DeleteCategoryResponse> {
  try {
    const client = getClient(adminClient)
    
    // First, remove this category from all content items
    const { error: removeError } = await client
      .from('content_categories')
      .delete()
      .eq('category_id', categoryId)
    
    if (removeError) {
      console.error('Error removing category from content items:', removeError)
      return {
        success: false,
        error: 'Nepavyko pašalinti kategorijos iš turinio elementų'
      }
    }
    
    // Then delete the category itself
    const { error: deleteError } = await client
      .from('categories')
      .delete()
      .eq('id', categoryId)
    
    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return {
        success: false,
        error: 'Nepavyko ištrinti kategorijos'
      }
    }
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Error in deleteCategory:', error)
    return {
      success: false,
      error: 'Įvyko klaida trinant kategoriją'
    }
  }
} 