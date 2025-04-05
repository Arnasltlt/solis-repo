import { getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'
import { serializeForClient } from '@/lib/utils/serialization'
import { NewContentEditor } from './NewContentEditor'

export default async function NewContentPage() {
  const cookieStore = cookies()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  let isAdmin = false
  
  if (user && user.role === 'administrator') {
    isAdmin = true
  }
  
  const [ageGroups, categories, accessTiers] = await Promise.all([
    getAgeGroups(supabase),
    getCategories(supabase),
    getAccessTiers(supabase)
  ])
  
  const serializedAgeGroups = serializeForClient(ageGroups)
  const serializedCategories = serializeForClient(categories)
  const serializedAccessTiers = serializeForClient(accessTiers)
  
  return (
    <NewContentEditor
      ageGroups={serializedAgeGroups}
      categories={serializedCategories}
      accessTiers={serializedAccessTiers}
    />
  )
}