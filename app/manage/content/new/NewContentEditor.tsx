'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from '@/components/ui/page-header'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { SparklesIcon, CheckIcon, ChevronRightIcon, ArrowLeft, Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckboxCardGroup } from '@/components/ui/checkbox-card-group'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { createFileCopy } from '@/lib/utils/debug-utils'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'

// Create a schema for content
const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Please select a content type",
  }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  thumbnail: z.any().optional(),
  ageGroups: z.array(z.string()).min(1, { message: "Please select at least one age group" }),
  categories: z.array(z.string()).min(1, { message: "Please select at least one category" }),
  accessTierId: z.string().min(1, { message: "Please select an access tier" }),
  published: z.boolean().default(false),
})

interface NewContentEditorProps {
  ageGroups: any[]
  categories: any[]
  accessTiers: any[]
}

export function NewContentEditor({ 
  ageGroups, 
  categories, 
  accessTiers 
}: NewContentEditorProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { isAdmin } = useAuthorization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Check authentication directly
  useEffect(() => {
    if (isLoading) return
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access content creation',
        variant: 'destructive'
      })
      router.push('/login?callbackUrl=/manage/content/new')
      return
    }
    
    // If authenticated but not admin, redirect home
    if (isAuthenticated && !isAdmin()) {
      toast({
        title: 'Access denied',
        description: 'You need administrator access to create content',
        variant: 'destructive'
      })
      router.push('/')
      return
    }
    
    console.log('Authentication verified:', { 
      email: user?.email,
      isAuthenticated,
      isAdmin: isAdmin()
    })
  }, [isAuthenticated, isLoading, user, isAdmin, router])
  
  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: "",
      description: "",
      ageGroups: [],
      categories: [],
      accessTierId: accessTiers.find(tier => tier.name === 'free')?.id || '',
      published: false,
    },
  })
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!supabase) {
      setError("Database connection not available")
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log("Creating content with values:", values)
      
      // Verify that we have a valid user session before proceeding
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session?.user?.id) {
        throw new Error("No authenticated user found. Please log in again.")
      }
      
      // Step 1: Create a unique slug based on title
      const timestamp = new Date().getTime()
      const slug = `${values.title.toLowerCase().replace(/[^\w-]+/g, '-')}-${timestamp.toString().slice(-6)}`
      
      // Step 2: Create the content record
      const contentData = {
        title: values.title,
        description: values.description,
        type: values.type,
        slug: slug,
        content_body: '',
        published: values.published,
        access_tier_id: values.accessTierId,
        author_id: sessionData.session.user.id,
        thumbnail_url: '',
      }
      
      // Log the data we're going to insert
      console.log("Inserting content data:", contentData)
      
      // Step 3: Insert into database
      const { data: contentItem, error: contentError } = await supabase
        .from('content_items')
        .insert(contentData)
        .select('id')
        .single()
      
      if (contentError) {
        console.error("Database error creating content:", contentError)
        throw contentError
      }
      
      if (!contentItem) {
        throw new Error("Content created but no ID returned")
      }
      
      const contentId = contentItem.id
      
      // Step 4: Upload thumbnail if provided
      if (values.thumbnail instanceof File) {
        try {
          const filename = `${contentId}/thumbnail.${values.thumbnail.name.split('.').pop()}`
          
          // Create a file copy to ensure it's a valid File object
          const copyResult = await createFileCopy(values.thumbnail)
          
          if (!copyResult.success || !copyResult.file) {
            console.error("Failed to create file copy:", copyResult.error)
            throw new Error("Failed to prepare thumbnail for upload")
          }
          
          // Try uploading to 'thumbnails' bucket instead of 'content'
          const { error: uploadError } = await supabase.storage
            .from('thumbnails')
            .upload(filename, copyResult.file, {
              upsert: true,
              contentType: copyResult.file.type
            })
          
          if (uploadError) {
            console.error("Error uploading thumbnail:", uploadError)
            // Continue without thumbnail rather than failing completely
            console.log("Continuing without thumbnail...")
          } else {
            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('thumbnails')
              .getPublicUrl(filename)
            
            // Update the thumbnail URL in the content record
            await supabase
              .from('content_items')
              .update({ thumbnail_url: urlData.publicUrl })
              .eq('id', contentId)
          }
        } catch (thumbError) {
          // Log but don't throw error - continue without thumbnail
          console.error("Thumbnail upload process failed:", thumbError)
          console.log("Continuing without thumbnail...")
        }
      }
      
      // Step 5: Add age groups and categories
      if (values.ageGroups.length > 0) {
        const ageGroupInserts = values.ageGroups.map(agId => ({
          content_id: contentId,
          age_group_id: agId
        }))
        
        await supabase
          .from('content_age_groups')
          .insert(ageGroupInserts)
      }
      
      if (values.categories.length > 0) {
        const categoryInserts = values.categories.map(catId => ({
          content_id: contentId,
          category_id: catId
        }))
        
        await supabase
          .from('content_categories')
          .insert(categoryInserts)
      }
      
      // Show success message
      toast({
        title: "Content created",
        description: "Now let's add the full content body",
      })
      
      // Always navigate to the editor page
      router.push(`/manage/content/editor/${contentId}`)
      
    } catch (err) {
      console.error("Error creating content:", err)
      
      // Check if this is a storage bucket error
      const errorMessage = err instanceof Error ? err.message : "Failed to create content";
      const isBucketError = errorMessage.includes("Bucket not found");
      
      if (isBucketError) {
        setError("The storage bucket for thumbnails doesn't exist. Content created without thumbnail.")
        
        toast({
          title: "Warning",
          description: "Content created but couldn't upload thumbnail. Storage bucket doesn't exist.",
          variant: "default"
        })
        
        // Try to redirect to editor anyway
        try {
          const { data } = await supabase
            .from('content_items')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (data?.id) {
            router.push(`/manage/content/editor/${data.id}`)
            return;
          }
        } catch (redirectErr) {
          console.error("Failed to find newly created content:", redirectErr)
        }
      } else {
        setError(errorMessage)
        
        toast({
          title: "Error",
          description: "Failed to create content. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle thumbnail file change
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      form.setError('thumbnail', { 
        message: "File size must be less than 5MB" 
      })
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      form.setError('thumbnail', { 
        message: "Only image files are allowed" 
      })
      return
    }
    
    // Set the file in the form
    form.setValue('thumbnail', file)
    form.clearErrors('thumbnail')
    
    // Create a preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
  }
  
  // Clear thumbnail
  const clearThumbnail = () => {
    form.setValue('thumbnail', null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }
  
  return (
    <ProtectedRoute requiredRole="administrator">
      <div className="container py-8">
        <PageHeader
          title="Create New Content"
          description="Add a new content item to your library"
          actions={
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          }
        />
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Content Type */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Content Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="video" />
                          </FormControl>
                          <FormLabel className="font-normal">Video</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="audio" />
                          </FormControl>
                          <FormLabel className="font-normal">Audio</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="lesson_plan" />
                          </FormControl>
                          <FormLabel className="font-normal">Lesson Plan</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="game" />
                          </FormControl>
                          <FormLabel className="font-normal">Game</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter content title" {...field} />
                    </FormControl>
                    <FormDescription>A clear, concise title for your content</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter content description" 
                        className="resize-none" 
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>A brief description of your content</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Thumbnail */}
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-foreground hover:file:bg-primary/20"
                          {...field}
                        />
                        
                        {previewUrl && (
                          <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={clearThumbnail}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Visual representation of your content. Recommended size: 1280×720px.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Age Groups */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Audience & Categories</h2>
              
              <FormField
                control={form.control}
                name="ageGroups"
                render={() => (
                  <FormItem>
                    <CheckboxCardGroup
                      form={form}
                      name="ageGroups"
                      label="Age Groups"
                      description="Select the age groups this content is suitable for"
                      items={ageGroups.map(group => ({
                        id: group.id,
                        label: group.range,
                        description: group.description || '',
                      }))}
                    />
                  </FormItem>
                )}
              />
              
              {/* Categories */}
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <CheckboxCardGroup
                      form={form}
                      name="categories"
                      label="Categories"
                      description="Select the categories this content belongs to"
                      items={categories.map(category => ({
                        id: category.id,
                        label: category.name,
                        description: category.description || '',
                      }))}
                    />
                  </FormItem>
                )}
              />
              
              {/* Access Tier */}
              <FormField
                control={form.control}
                name="accessTierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accessTiers
                          .filter(tier => ['free', 'premium'].includes(tier.name))
                          .map((tier) => (
                            <SelectItem 
                              key={tier.id} 
                              value={tier.id}
                              className="flex items-center gap-2"
                            >
                              {tier.name === 'premium' ? (
                                <div className="flex items-center gap-2">
                                  <SparklesIcon className="w-4 h-4 text-yellow-500" />
                                  Premium
                                </div>
                              ) : (
                                'Free'
                              )}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the access level for this content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Published Status */}
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish immediately
                      </FormLabel>
                      <FormDescription>
                        Content will be visible to users based on the selected access tier
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Continue to Editor
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
    </ProtectedRoute>
  )
}