'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ContentForm } from '@/components/content/content-form'
import { createContent, getContentItems, getAgeGroups, getCategories, getAccessTiers } from '@/lib/services/content'
import type { ContentFormData as FormData } from '@/lib/types/content'
import type { AgeGroup, Category, AccessTier, ContentItem } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Define the CreateContentRequest type
interface CreateContentRequest {
  title: string;
  description: string;
  type: string;
  content_body: string;
  published: boolean;
  age_groups: string[];
  categories: string[];
  access_tier_id: string;
  thumbnail: File | null;
}

// Simple spinner component
const Spinner = ({ className }: { className?: string }) => (
  <div className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${className}`} />
);

interface ClientManageContentPageProps {
  ageGroups?: AgeGroup[];
  categories?: Category[];
  accessTiers?: AccessTier[];
}

export function ClientManageContentPage({
  ageGroups: initialAgeGroups = [],
  categories: initialCategories = [],
  accessTiers: initialAccessTiers = []
}: ClientManageContentPageProps) {
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>(initialAgeGroups)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [accessTiers, setAccessTiers] = useState<AccessTier[]>(initialAccessTiers)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only fetch data if not provided via props
        if (initialAgeGroups.length === 0 || initialCategories.length === 0 || initialAccessTiers.length === 0) {
          const [ageGroupsData, categoriesData, accessTiersData] = await Promise.all([
            initialAgeGroups.length === 0 ? getAgeGroups().catch(err => {
              console.error('Error loading age groups:', err);
              return initialAgeGroups;
            }) : Promise.resolve(initialAgeGroups),
            initialCategories.length === 0 ? getCategories().catch(err => {
              console.error('Error loading categories:', err);
              return initialCategories;
            }) : Promise.resolve(initialCategories),
            initialAccessTiers.length === 0 ? getAccessTiers().catch(err => {
              console.error('Error loading access tiers:', err);
              return initialAccessTiers;
            }) : Promise.resolve(initialAccessTiers)
          ])
          
          setAgeGroups(ageGroupsData || [])
          setCategories(categoriesData || [])
          setAccessTiers(accessTiersData || [])
        }
      } catch (err) {
        setError('Failed to load form data. Please try again.')
        console.error('Error loading form data:', err)
        
        // Ensure we have at least empty arrays to prevent null reference errors
        if (ageGroups.length === 0) setAgeGroups([])
        if (categories.length === 0) setCategories([])
        if (accessTiers.length === 0) setAccessTiers([])
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    async function loadContent() {
      setIsLoadingContent(true)
      try {
        const items = await getContentItems()
        setContentItems(items)
      } catch (error) {
        console.error('Error loading content:', error)
        toast({
          variant: "destructive",
          title: "Klaida",
          description: "Nepavyko užkrauti turinio elementų.",
        })
      } finally {
        setIsLoadingContent(false)
      }
    }
    
    loadContent()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Validate required fields
      if (!formData.title || !formData.type || !formData.ageGroups?.length || 
          !formData.categories?.length || !formData.accessTierId) {
        throw new Error('Please fill in all required fields')
      }
      
      // Create content directly with the form data
      const result = await createContent({
        title: formData.title,
        description: formData.description || '',
        type: formData.type,
        ageGroups: formData.ageGroups,
        categories: formData.categories,
        accessTierId: formData.accessTierId,
        contentBody: formData.contentBody || '',
        published: formData.published,
        thumbnail: formData.thumbnail || null
      })
      
      // Show success message
      toast({
        title: "Content Created",
        description: "Your content has been successfully created.",
      })
      
      // Redirect to content list
      router.push('/manage/content')
    } catch (err) {
      console.error('Error creating content:', err)
      
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create content. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => setError(null)} 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Tabs defaultValue="create">
        <TabsList className="mb-8">
          <TabsTrigger value="create">Naujas turinys</TabsTrigger>
          <TabsTrigger value="list">Turinio sąrašas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <h1 className="text-2xl font-bold mb-8">Naujas turinys</h1>
          {ageGroups.length > 0 && categories.length > 0 && accessTiers.length > 0 ? (
            <ContentForm
              ageGroups={ageGroups}
              categories={categories}
              accessTiers={accessTiers}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          <h1 className="text-2xl font-bold mb-8">Turinio sąrašas</h1>
          
          {isLoadingContent ? (
            <div className="flex justify-center p-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          ) : contentItems.length > 0 ? (
            <div className="grid gap-6">
              {contentItems.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                          {item.type === 'video' && 'Video'}
                          {item.type === 'audio' && 'Daina'}
                          {item.type === 'lesson_plan' && 'Pamoka'}
                          {item.type === 'game' && 'Žaidimas'}
                        </span>
                        
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          item.access_tier?.name === 'premium' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.access_tier?.name === 'premium' ? 'Premium' : 'Free'}
                        </span>
                        
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          item.published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Created: {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/medziaga/${item.slug}`)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No content items found</p>
              <Button onClick={() => {
                const createTab = document.querySelector('[data-state="inactive"][value="create"]') as HTMLElement;
                if (createTab) createTab.click();
              }}>
                Create your first content
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 