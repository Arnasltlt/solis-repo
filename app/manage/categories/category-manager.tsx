'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  createCategory, 
  deleteCategory, 
  getCategoryUsage 
} from '@/lib/services/categories'
import { Category } from '@/lib/types/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface CategoryManagerProps {
  initialCategories: Category[]
}

interface CategoryWithUsage extends Category {
  usageCount?: number;
  isLoadingUsage?: boolean;
}

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryWithUsage[]>(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithUsage | null>(null)
  const [categoryUsage, setCategoryUsage] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Load usage counts for all categories when component mounts
  useEffect(() => {
    const loadUsageCounts = async () => {
      const updatedCategories = [...categories];
      
      for (let i = 0; i < updatedCategories.length; i++) {
        const category = updatedCategories[i];
        category.isLoadingUsage = true;
        setCategories([...updatedCategories]);
        
        try {
          const response = await getCategoryUsage(category.id);
          if (response.success && response.usage) {
            updatedCategories[i] = {
              ...category,
              usageCount: response.usage.count,
              isLoadingUsage: false
            };
          } else {
            updatedCategories[i] = {
              ...category,
              usageCount: 0,
              isLoadingUsage: false
            };
          }
        } catch (err) {
          console.error(`Error loading usage count for category ${category.id}:`, err);
          updatedCategories[i] = {
            ...category,
            usageCount: 0,
            isLoadingUsage: false
          };
        }
        
        setCategories([...updatedCategories]);
      }
    };
    
    loadUsageCounts();
  }, []);

  // Create a new category
  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      setError('Kategorijos pavadinimas negali būti tuščias')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      const response = await createCategory(newCategoryName.trim())
      
      if (response.success && response.category) {
        // Add the new category with a usage count of 0
        setCategories(prev => [...prev, { 
          ...response.category!, 
          usageCount: 0 
        }])
        setNewCategoryName('')
        toast.success('Kategorija sėkmingai sukurta')
      } else {
        setError(response.error || 'Nepavyko sukurti kategorijos')
        toast.error(response.error || 'Nepavyko sukurti kategorijos')
      }
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Įvyko klaida kuriant kategoriją')
      toast.error('Įvyko klaida kuriant kategoriją')
    } finally {
      setIsCreating(false)
    }
  }, [newCategoryName])

  // Check category usage before deletion
  const handleCheckCategoryUsage = useCallback(async (category: CategoryWithUsage) => {
    setSelectedCategory(category)
    setIsDeleting(true)
    setCategoryUsage(null)

    try {
      // If we already have the usage count, use it
      if (category.usageCount !== undefined) {
        setCategoryUsage(category.usageCount)
        setIsDeleteDialogOpen(true)
        setIsDeleting(false)
        return;
      }
      
      // Otherwise fetch it
      const response = await getCategoryUsage(category.id)
      
      if (response.success && response.usage) {
        setCategoryUsage(response.usage.count)
        setIsDeleteDialogOpen(true)
      } else {
        toast.error(response.error || 'Nepavyko gauti kategorijos naudojimo informacijos')
      }
    } catch (err) {
      console.error('Error checking category usage:', err)
      toast.error('Įvyko klaida tikrinant kategorijos naudojimą')
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Delete a category
  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return
    
    setIsDeleting(true)
    
    try {
      const response = await deleteCategory(selectedCategory.id)
      
      if (response.success) {
        setCategories(prev => prev.filter(c => c.id !== selectedCategory.id))
        setIsDeleteDialogOpen(false)
        setSelectedCategory(null)
        setCategoryUsage(null)
        toast.success('Kategorija sėkmingai ištrinta')
      } else {
        toast.error(response.error || 'Nepavyko ištrinti kategorijos')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      toast.error('Įvyko klaida trinant kategoriją')
    } finally {
      setIsDeleting(false)
    }
  }, [selectedCategory])

  return (
    <div className="space-y-8">
      {/* Create new category section */}
      <Card>
        <CardHeader>
          <CardTitle>Sukurti naują kategoriją</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Kategorijos pavadinimas"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleCreateCategory} 
              disabled={isCreating || !newCategoryName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kuriama...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Sukurti
                </>
              )}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* Categories list section */}
      <Card>
        <CardHeader>
          <CardTitle>Esamos kategorijos</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">Nėra sukurtų kategorijų</p>
          ) : (
            <ul className="divide-y">
              {categories.map((category) => (
                <li key={category.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    {category.isLoadingUsage ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {category.usageCount} {category.usageCount === 1 ? 'elementas' : 'elementai'}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCheckCategoryUsage(category)}
                    disabled={isDeleting && selectedCategory?.id === category.id}
                  >
                    {isDeleting && selectedCategory?.id === category.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ištrinti kategoriją</DialogTitle>
            <DialogDescription>
              {categoryUsage !== null && categoryUsage > 0 ? (
                `Ši kategorija naudojama ${categoryUsage} turinio elementuose. Ištrynus kategoriją, ji bus pašalinta iš visų turinio elementų.`
              ) : (
                'Ar tikrai norite ištrinti šią kategoriją?'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Atšaukti
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Trinama...
                </>
              ) : (
                'Ištrinti'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 