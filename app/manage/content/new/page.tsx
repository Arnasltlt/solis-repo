import { getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import { serializeForClient } from '@/lib/utils/serialization'
import { NewContentEditor } from './NewContentEditor'

export default async function NewContentPage() {
  // Fetch reference data with the anon client to avoid session role issues
  
  const [ageGroups, categories, accessTiers] = await Promise.all([
    getAgeGroups(),
    getCategories(),
    getAccessTiers()
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