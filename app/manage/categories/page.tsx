import { Metadata } from 'next'
import { getCategories } from '@/lib/services/categories'
import CategoryManager from './category-manager'

export const metadata: Metadata = {
  title: 'Kategorijų valdymas | Solis',
  description: 'Solis platformos kategorijų valdymo skydelis',
}

export default async function CategoriesPage() {
  // Fetch all categories
  const categories = await getCategories()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Kategorijų valdymas</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  )
} 