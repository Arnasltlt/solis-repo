import { createClient } from '@/lib/supabase/admin'
import { ContentManagementPage } from '@/components/content/ContentManagementPage'
import { getAgeGroups, getCategories, getAllContentForManagement } from '@/lib/services/content'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Turinio valdymas | Solis',
  description: 'Valdykite platformos turinį',
}

export default async function ContentListPage() {
  const supabase = createClient()
  
  try {
    // Fetch all data in parallel
    const [contentItems, ageGroups, categories] = await Promise.all([
      getAllContentForManagement(supabase),
      getAgeGroups(),
      getCategories()
    ])

    return (
      <ContentManagementPage
        contentItems={contentItems || []}
        ageGroups={ageGroups || []}
        categories={categories || []}
        canCreate={true}
      />
    )
  } catch (error) {
    console.error('Error loading content management data:', error)
    
    // Return empty state on error
    return (
      <ContentManagementPage
        contentItems={[]}
        ageGroups={[]}
        categories={[]}
        canCreate={true}
      />
    )
  }
}
