import { getContentById, getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/types/database'
import { ContentEditor } from '../../../editor/[id]/ContentEditor'
import { EditContentForm } from './EditContentForm'

export default async function EditContentPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Check authentication at the server side
  const { data: { session } } = await supabase.auth.getSession()
  
  // We still need content ID for the editor, even if we may end up redirecting
  // on the client side if the user isn't authenticated or not an admin
  
  try {
    // Fetch the content and supporting data
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