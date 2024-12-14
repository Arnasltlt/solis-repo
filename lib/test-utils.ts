import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function testDatabaseConnection() {
  const results: Record<string, any> = {}

  try {
    // Test 0: Check authentication state
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      results.auth = { success: false, error: authError.message }
      console.log('❌ Auth check failed:', authError.message)
    } else {
      results.auth = { 
        success: true, 
        data: { 
          isAuthenticated: !!session,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role
          } : null
        } 
      }
      console.log('✅ Auth check successful:', session ? 'Authenticated' : 'Not authenticated')
    }

    // Test 1: Query age groups
    const { data: ageGroups, error: ageError } = await supabase
      .from('age_groups')
      .select('*')
    
    if (ageError) throw new Error(`Age groups error: ${ageError.message}`)
    results.ageGroups = { success: true, data: ageGroups }
    console.log('✅ Age groups query successful:', ageGroups)

    // Test 2: Query categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
    
    if (catError) throw new Error(`Categories error: ${catError.message}`)
    results.categories = { success: true, data: categories }
    console.log('✅ Categories query successful:', categories)

    // Test 3: Test storage buckets
    const buckets = ['audio-content', 'documents', 'thumbnails', 'game-assets']
    results.buckets = {}

    for (const bucketName of buckets) {
      try {
        const { data: listData, error: listError } = await supabase
          .storage
          .from(bucketName)
          .list()
        
        if (listError) {
          results.buckets[bucketName] = { 
            success: false, 
            error: listError.message,
            note: 'Error listing bucket contents'
          }
          console.log(`❌ Bucket ${bucketName} list error:`, listError.message)
          continue
        }

        // Try to get bucket metadata
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .getBucket(bucketName)
        
        if (bucketError) {
          results.buckets[bucketName] = { 
            success: false, 
            error: bucketError.message,
            note: 'Error getting bucket metadata, but listing worked'
          }
          console.log(`⚠️ Bucket ${bucketName} metadata error:`, bucketError.message)
        } else {
          results.buckets[bucketName] = { 
            success: true, 
            data: {
              metadata: bucketData,
              contents: listData
            }
          }
          console.log(`✅ Bucket ${bucketName} fully accessible:`, { bucketData, listData })
        }
      } catch (error) {
        results.buckets[bucketName] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          note: 'Unexpected error accessing bucket'
        }
        console.log(`❌ Bucket ${bucketName} unexpected error:`, error)
      }
    }

    return { 
      success: true, 
      results,
      message: 'Tests completed. Check individual results for details.' 
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { 
      success: false, 
      results,
      message: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 

export async function testAuth() {
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    // Try to refresh the session
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) throw refreshError

    return {
      success: true,
      data: {
        hasSession: !!session,
        sessionRefreshed: !!refreshedSession,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          lastSignInAt: session.user.last_sign_in_at
        } : null
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error checking auth state'
    }
  }
} 