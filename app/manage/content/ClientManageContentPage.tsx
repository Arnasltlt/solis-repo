'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ContentForm } from '@/components/content/content-form'
import { createContent, getContentItems, getAgeGroups, getCategories, getAccessTiers, updateContent } from '@/lib/services/content'
import type { ContentFormData } from '@/lib/types/content'
import type { AgeGroup, Category, AccessTier, ContentItem } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Eye, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@radix-ui/react-switch"
import { useSupabase } from '@/components/supabase-provider'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('create')
  const editContentId = searchParams.get('edit')
  const { supabase } = useSupabase()

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'create' || tabParam === 'list') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const url = `/manage/content?tab=${value}`
    // Use push instead of replace to avoid hydration issues
    router.push(url)
  }

  useEffect(() => {
    async function loadContent() {
      if (!supabase) return
      
      setIsLoadingContent(true)
      try {
        const items = await getContentItems({ adminClient: supabase })
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
  }, [supabase])

  const handleSubmit = async (formData: ContentFormData) => {
    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko inicializuoti Supabase kliento.",
      })
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (editContentId) {
        await updateContent(editContentId, formData, supabase)
        toast({
          title: "Turinys atnaujintas",
          description: "Jūsų turinys sėkmingai atnaujintas",
        })
      } else {
        await createContent(formData, supabase)
        toast({
          title: "Turinys sukurtas",
          description: "Jūsų turinys sėkmingai sukurtas",
        })
      }
      
      // Clear draft and redirect to list
      localStorage.removeItem('content-form-draft')
      router.replace('/manage/content?tab=list')
    } catch (err) {
      console.error('Error handling content:', err)
      setError(err instanceof Error ? err.message : 'Įvyko nenumatyta klaida')
      
      toast({
        variant: "destructive",
        title: "Klaida",
        description: editContentId 
          ? "Nepavyko atnaujinti turinio"
          : "Nepavyko sukurti turinio",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishToggle = async (item: ContentItem) => {
    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko inicializuoti Supabase kliento.",
      })
      return
    }
    
    try {
      await updateContent(item.id, {
        published: !item.published
      }, supabase)
      
      // Update local state
      setContentItems(prev => prev.map(content => 
        content.id === item.id 
          ? { ...content, published: !content.published }
          : content
      ))
      
      toast({
        title: item.published ? "Turinys nepublikuotas" : "Turinys publikuotas",
        description: item.published 
          ? "Turinys dabar yra juodraščio būsenoje" 
          : "Turinys dabar yra matomas visiems",
      })
    } catch (error) {
      console.error('Error toggling publish state:', error)
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko pakeisti publikavimo būsenos",
      })
    }
  }

  // Handle edit navigation
  const handleEdit = (item: ContentItem) => {
    // Save the item to edit in localStorage
    localStorage.setItem('content-form-draft', JSON.stringify({
      type: item.type,
      title: item.title,
      description: item.description,
      ageGroups: item.age_groups.map(ag => ag.id),
      categories: item.categories.map(c => c.id),
      accessTierId: item.access_tier_id,
      contentBody: item.content_body,
      published: item.published,
      thumbnail: item.thumbnail_url
    }))
    
    // Use push for navigation
    router.push(`/manage/content?tab=create&edit=${item.id}`)
  }

  // Handle preview navigation
  const handlePreview = (slug: string) => {
    router.push(`/medziaga/${slug}`)
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Klaida</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => setError(null)} 
          className="mt-4"
        >
          Bandyti dar kartą
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-12">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="bg-white rounded-xl shadow-sm">
          <div className="border-b px-6 pt-6 pb-4">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1">
              <TabsTrigger value="create" className="ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                {editContentId ? "Redaguoti turinį" : "Kurti turinį"}
              </TabsTrigger>
              <TabsTrigger value="list" className="ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Turinio sąrašas
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="create" className="mt-0 px-6 pb-6">
            <div className="my-6">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {editContentId ? "Redaguoti turinį" : "Kurti naują turinį"}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {editContentId 
                  ? "Atnaujinkite turinio informaciją ir turinį" 
                  : "Sukurkite naują turinį platformai"
                }
              </p>
            </div>
            <div className="bg-white">
              <ContentForm
                ageGroups={initialAgeGroups}
                categories={initialCategories}
                accessTiers={initialAccessTiers}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                initialData={editContentId ? JSON.parse(localStorage.getItem('content-form-draft') || '{}') : undefined}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0 px-6 pb-6">
            <div className="my-6">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">Turinio sąrašas</h1>
                  <p className="mt-2 text-lg text-gray-600">
                    Peržiūrėkite ir redaguokite esamą turinį
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <Button onClick={() => handleTabChange('create')} className="w-full sm:w-auto">
                    Kurti naują turinį
                  </Button>
                </div>
              </div>
            </div>
            
            {isLoadingContent ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="inline-block animate-spin rounded-full border-4 border-solid border-primary border-r-transparent h-12 w-12" />
              </div>
            ) : contentItems.length > 0 ? (
              <div className="grid gap-6">
                {contentItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                      item.published ? 'border-green-100' : 'border-yellow-100'
                    }`}
                  >
                    <div className="p-6">
                      <div className="sm:flex sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-2xl font-semibold text-gray-900 truncate">{item.title}</h2>
                          <p className="mt-2 text-gray-600 line-clamp-2">{item.description}</p>
                          
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-sm">
                              {item.type === 'video' && 'Video'}
                              {item.type === 'audio' && 'Daina'}
                              {item.type === 'lesson_plan' && 'Pamoka'}
                              {item.type === 'game' && 'Žaidimas'}
                            </Badge>
                            
                            <Badge 
                              variant={item.access_tier?.name === 'premium' ? 'premium' : 'secondary'}
                              className="text-sm"
                            >
                              {item.access_tier?.name === 'premium' ? 'Premium' : 'Nemokamas'}
                            </Badge>
                            
                            <Badge 
                              variant={item.published ? 'secondary' : 'outline'}
                              className={`text-sm ${item.published ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'}`}
                            >
                              {item.published ? 'Publikuota' : 'Juodraštis'}
                            </Badge>
                          </div>
                          
                          <div className="mt-4 text-sm text-gray-500">
                            Sukurta: {new Date(item.created_at).toLocaleDateString('lt-LT')}
                          </div>
                        </div>
                        
                        <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                            <Switch
                              checked={item.published}
                              onCheckedChange={() => handlePublishToggle(item)}
                              className="data-[state=checked]:bg-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {item.published ? 'Publikuota' : 'Juodraštis'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePreview(item.slug)}
                              className="flex-1 sm:flex-none"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Peržiūrėti
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="flex-1 sm:flex-none"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Redaguoti
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center rounded-lg bg-white border-2 border-dashed border-gray-200 p-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nėra sukurto turinio</h3>
                <p className="text-gray-500 mb-6">Pradėkite kurti turinį ir jis atsiras čia</p>
                <Button onClick={() => handleTabChange('create')} size="lg">
                  Sukurti pirmąjį turinį
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 