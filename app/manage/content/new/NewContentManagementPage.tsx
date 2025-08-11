'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { createContent } from '@/lib/services/content'
import { createFileCopy } from '@/lib/utils/debug-utils'
import type { ContentFormData } from '@/lib/types/content'
import type { AgeGroup, Category, AccessTier } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Loader2, ArrowRight } from 'lucide-react'

interface NewContentManagementPageProps {
  ageGroups: AgeGroup[];
  categories: Category[];
  accessTiers: AccessTier[];
}

export function NewContentManagementPage({
  ageGroups,
  categories,
  accessTiers
}: NewContentManagementPageProps) {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  
  // Debug session info
  useEffect(() => {
    console.log('Session check in NewContentManagementPage:', {
      hasSession: !!session,
      sessionId: session?.user?.id,
      timeChecked: new Date().toISOString()
    })
  }, [session])
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState<'video' | 'audio' | 'lesson_plan' | 'game'>('lesson_plan')
  const [published, setPublished] = useState(false)
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAccessTier, setSelectedAccessTier] = useState('')
  
  // File state
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // UI state
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  
  // Add a log message
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const scrollPosition = window.scrollY
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Thumbnail must be less than 5MB',
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only image files are allowed for thumbnails',
        })
        return
      }

      setFile(file)
      setPreviewUrl(URL.createObjectURL(file))

      // Restore scroll position after thumbnail preview causes layout shift
      requestAnimationFrame(() => window.scrollTo(0, scrollPosition))
    }
  }
  
  // Handle age group selection
  const handleAgeGroupChange = (ageGroupId: string, checked: boolean) => {
    if (checked) {
      setSelectedAgeGroups(prev => [...prev, ageGroupId])
    } else {
      setSelectedAgeGroups(prev => prev.filter(id => id !== ageGroupId))
    }
  }
  
  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId])
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }
  
  // Handle content creation - Step 1: Create content metadata
  const handleCreateContent = async () => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return
    }
    
    if (!session) {
      setError('You must be logged in to create content')
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create content. Please log in and try again.',
      })
      router.push('/login?callbackUrl=/manage/content/new')
      return
    }
    
    // Validate form
    if (!title) {
      setError('Title is required')
      return
    }
    
    if (!description) {
      setError('Description is required')
      return
    }
    
    if (selectedAgeGroups.length === 0) {
      setError('At least one age group must be selected')
      return
    }
    
    if (selectedCategories.length === 0) {
      setError('At least one category must be selected')
      return
    }
    
    if (!selectedAccessTier) {
      setError('Access tier is required')
      return
    }
    
    try {
      setIsCreating(true)
      setError(null)
      addLog('Creating content...')
      
      // Prepare content data
      const contentData: ContentFormData = {
        title,
        description,
        type: contentType,
        contentBody: '<p>Content will be edited after creation</p>', // Simple placeholder
        ageGroups: selectedAgeGroups,
        categories: selectedCategories,
        accessTierId: selectedAccessTier,
        published,
        thumbnail: file
      }
      
      // Create content record
      addLog('Saving content to database...')
      const contentItem = await createContent(contentData, supabase)
      
      if (!contentItem || !contentItem.id) {
        throw new Error('Failed to create content: No content ID returned')
      }
      
      addLog(`Content created with ID: ${contentItem.id}`)
      
      // Show success toast
      toast({
        title: 'Content Created',
        description: 'Your content has been created successfully. Now you can add the content body.',
      })
      
      // Save the content with the minimal needed data
      // The rich editor will be handled in the next step
      const editorUrl = `/manage/content/editor/${contentItem.id}`
      addLog(`Redirecting to editor: ${editorUrl}`)
      
      // Make sure we immediately save the content body state so it's available when redirecting
      if (typeof window !== 'undefined') {
        localStorage.setItem('content-form-draft', JSON.stringify({
          ...contentData,
          contentBody: contentData.contentBody || '',
          thumbnail: null // Don't try to serialize File objects
        }));
      }
      
      // Use a slight delay to ensure the toast is shown before redirecting
      // Instead of router.push, use window.location for a full page reload to ensure session is properly recognized
      setTimeout(() => {
        console.log(`Redirecting to ${editorUrl} with session ID ${session?.user?.id}`);
        window.location.href = editorUrl;
      }, 500)
    } catch (error) {
      const errorMsg = `Error creating content: ${error instanceof Error ? error.message : String(error)}`
      setError(errorMsg)
      addLog(errorMsg)
      
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg,
      })
    } finally {
      setIsCreating(false)
    }
  }
  
  // Handle back navigation
  const handleBack = () => {
    router.push('/manage/content?tab=list')
  }
  
  // Clear file
  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl(null)
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Content</h1>
        <Button 
          variant="outline" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Content List
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Information</CardTitle>
            <CardDescription>Enter the basic information about your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter content title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Enter content description"
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <Select 
                value={contentType} 
                onValueChange={(value) => setContentType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Thumbnail</CardTitle>
            <CardDescription>Upload a thumbnail image for your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90"
              />
              
              {previewUrl && (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Thumbnail preview" 
                    className="max-h-64 rounded-md"
                  />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={clearFile}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Age Groups</CardTitle>
            <CardDescription>Select the age groups this content is suitable for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ageGroups.map((ageGroup) => (
                <div key={ageGroup.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`age-group-${ageGroup.id}`}
                    checked={selectedAgeGroups.includes(ageGroup.id)}
                    onCheckedChange={(checked) => 
                      handleAgeGroupChange(ageGroup.id, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`age-group-${ageGroup.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {ageGroup.range}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Select the categories this content belongs to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Access Tier</CardTitle>
            <CardDescription>Select the access tier for this content</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedAccessTier} 
              onValueChange={setSelectedAccessTier}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select access tier" />
              </SelectTrigger>
              <SelectContent>
                {accessTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Set the publishing status of your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="published"
                checked={published}
                onCheckedChange={(checked) => setPublished(checked as boolean)}
              />
              <label 
                htmlFor="published"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Publish immediately
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              If unchecked, the content will be saved as a draft and won't be visible to users.
            </p>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleCreateContent} 
            disabled={isCreating}
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create & Continue to Editor
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 