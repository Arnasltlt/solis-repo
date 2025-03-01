import { getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { ClientManageContentPage } from './ClientManageContentPage'

export default async function ManageContentPage() {
  const [ageGroups, categories, accessTiers] = await Promise.all([
    getAgeGroups(),
    getCategories(),
    getAccessTiers()
  ])

  return (
    <ClientManageContentPage 
      ageGroups={ageGroups} 
      categories={categories} 
      accessTiers={accessTiers} 
    />
  )
} 