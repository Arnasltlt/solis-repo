'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import type { Category } from '@/lib/types/database'
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
import { createBrowserClient } from '@supabase/ssr';

interface CategoryManagerProps {
  initialCategories: Category[]
}

interface CategoryWithUsage extends Category {
  usageCount?: number;
  isLoadingUsage?: boolean;
}

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryWithUsage[]>(
    initialCategories.map(cat => ({ ...cat, usageCount: undefined, isLoadingUsage: true }))
  )
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [authDebug, setAuthDebug] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase.auth.getUser();
        console.log("Auth check client-side:", data, error);
        setAuthDebug({ user: data.user, error });
        
        // Removed token setting logic from here - handled by AuthProvider
        // const { data: sessionData } = await supabase.auth.getSession();
        // if (sessionData.session?.access_token) { ... }

      } catch (err) {
        console.error("Error checking auth:", err);
        setAuthDebug({ error: err });
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const loadUsageCounts = async () => {
      const usagePromises = categories.map(async (category) => {
        try {
          // Cookie-based auth only; server verifies admin via DB
          const response = await fetch(`/api/manage/categories/${category.id}/usage`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            return { ...category, usageCount: data.count ?? 0, isLoadingUsage: false };
          }
          
          // If that failed (401/403), log the error and return placeholder data
          console.error(`Error fetching usage for ${category.id}:`, response.statusText);
          return { ...category, usageCount: 0, isLoadingUsage: false };
          
        } catch (err) {
          console.error(`Error fetching usage for ${category.id}:`, err);
          return { ...category, usageCount: 0, isLoadingUsage: false };
        }
      });

      const updatedCategories = await Promise.all(usagePromises);
      setCategories(updatedCategories);
    };

    loadUsageCounts();
  }, []);

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      setError('Kategorijos pavadinimas negali būti tuščias')
      return
    }
    setError(null)
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/manage/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `HTTP error! status: ${response.status}`);
        toast.error(data.error || 'Nepavyko sukurti kategorijos');
      } else {
        setCategories(prev => [...prev, { ...data, usageCount: 0, isLoadingUsage: false }]);
        setNewCategoryName('');
        setNewCategoryDescription('');
        toast.success('Kategorija sėkmingai sukurta');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      const message = err instanceof Error ? err.message : 'Įvyko tinklo klaida kuriant kategoriją';
      setError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }, [newCategoryName, newCategoryDescription]);

  const handlePrepareDelete = useCallback((category: CategoryWithUsage) => {
    if (category.isLoadingUsage) {
        toast.info("Kraunama naudojimo informacija...");
        return;
    }
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/manage/categories/${selectedCategory.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || `HTTP error! status: ${response.status}`);
      } else {
        setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
        toast.success(data.message || 'Kategorija sėkmingai ištrinta');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      const message = err instanceof Error ? err.message : 'Įvyko tinklo klaida trinant kategoriją';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Debug info */}
      <div className="bg-yellow-100 p-4 rounded-md text-sm">
        <h3 className="font-bold">Auth Debug</h3>
        <pre className="mt-2 overflow-auto max-h-[200px]">{JSON.stringify(authDebug, null, 2)}</pre>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sukurti naują kategoriją</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Pavadinimas <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Kategorijos pavadinimas"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Aprašymas (nebūtinas)
              </label>
              <Input
                placeholder="Kategorijos aprašymas"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleCreateCategory} 
              disabled={isCreating || !newCategoryName.trim()}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kuriama...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Sukurti kategoriją
                </>
              )}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

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
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {category.isLoadingUsage ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {category.usageCount} {category.usageCount === 1 ? 'elementas' : 'elementai'}
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handlePrepareDelete(category)}
                    disabled={category.isLoadingUsage || (isDeleting && selectedCategory?.id === category.id)}
                  >
                    {(isDeleting && selectedCategory?.id === category.id) ? (
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ištrinti kategoriją</DialogTitle>
            <DialogDescription>
              {selectedCategory?.usageCount !== undefined && selectedCategory.usageCount > 0 ? (
                `Ši kategorija naudojama ${selectedCategory.usageCount} turinio elementuose. Ištrynus kategoriją, ji bus pašalinta iš visų turinio elementų.`
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