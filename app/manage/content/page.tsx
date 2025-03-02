import { getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { ClientManageContentPage } from './ClientManageContentPage'

export default async function ManageContentPage() {
  // Fetch the data needed for the content management page
  const ageGroups = await getAgeGroups()
  const categories = await getCategories()
  const accessTiers = await getAccessTiers()

  return (
    <ClientManageContentPage 
      ageGroups={ageGroups} 
      categories={categories} 
      accessTiers={accessTiers} 
    />
  )
} 