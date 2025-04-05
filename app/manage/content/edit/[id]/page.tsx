import { getContentById, getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'
import { EditContentForm } from './EditContentForm'

export default async function EditContentPage({ params }: { params: { id: string } }) {
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
  
  try {
    const [content, ageGroups, categories, accessTiers] = await Promise.all([
      getContentById(params.id, supabase),
      getAgeGroups(supabase),
      getCategories(supabase),
      getAccessTiers(supabase)
    ])
    
    if (!content) {
      return redirect('/manage?error=Content+not+found')
    }
    
    return (
      <div className="container py-8">
        <EditContentForm 
          content={content}
          ageGroups={ageGroups}
          categories={categories}
          accessTiers={accessTiers}
        />
      </div>
    )
  } catch (error) {
    console.error('Error fetching content:', error)
    return redirect('/manage?error=Error+fetching+content')
  }
}