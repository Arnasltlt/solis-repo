import { Metadata } from 'next'
import { getCategories } from '@/lib/services/categories'
import CategoryManager from './category-manager'
import type { Category } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Kategorijų valdymas | Solis',
  description: 'Solis platformos kategorijų valdymo skydelis',
}

export default async function CategoriesPage() {
  // Fetch all categories
  const categoriesFromService = await getCategories()
  
  // Convert to the required type with parent_id
  const categories: Category[] = categoriesFromService.map(cat => ({
    ...cat,
    parent_id: null, // Add the required parent_id field
    description: cat.description || null // Ensure description is string | null, not undefined
  }))

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Kategorijų valdymas</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  )
} 