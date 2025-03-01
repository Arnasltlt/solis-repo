import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Utility functions for testing database connections and functionality
 */

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Tests the database connection by attempting to query the content_items table
 * @returns Results object with success/failure information
 */
export async function testDatabaseConnection() {
  const results: Record<string, any> = {}

  try {
    // Test 1: Check database connection
    const { data, error } = await supabase
      .from('content_items')
      .select('count')
      .limit(1)

    if (error) {
      results.database = { success: false, error: error.message }
    } else {
      results.database = { success: true }
    }

    return results
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 