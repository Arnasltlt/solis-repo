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
import { useAuth, UserRoles } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { FileAttachmentsUploader } from '@/components/content/file-attachments-uploader'
import type { AttachmentFile } from '@/components/content/file-attachments-uploader'

// Create a schema for content
const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Please select a content type",
  }),
  title: z.string().min(1, { message: "Title is required" }),
  thumbnail: z.any().optional(),
  ageGroups: z.array(z.string()).min(1, { message: "Please select at least one age group" }),
  categories: z.array(z.string()).min(1, { message: "Please select at least one category" }),
  accessTierId: z.string().min(1, { message: "Please select an access tier" }),
  published: z.boolean().default(false),
  attachments: z.array(z.any()).optional(),
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
  const { isAuthenticated, loading, user } = useAuth()
  const { isAdmin } = useAuthorization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [attachmentsUploading, setAttachmentsUploading] = useState(false)
  
  // Check authentication directly
  useEffect(() => {
    if (loading) return
    
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
  }, [isAuthenticated, loading, user, isAdmin, router])
  
  // Define form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      title: "",
      ageGroups: [],
      categories: [],
      accessTierId: accessTiers.find(tier => tier.name === 'free')?.id || '',
      published: false,
      attachments: [],
    },
  })
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (attachmentsUploading) {
      toast({
        title: 'Failai dar įkeliami',
        description: 'Palaukite kol įkėlimas bus užbaigtas prieš kuriant turinį.',
        variant: 'destructive'
      })
      return
    }
    // --- ADDED DEBUG LOG --- 
    console.log('%%% ENTERING NewContentEditor onSubmit - API Route Version %%%');
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log("Submitting content form with values:", values)
      
      // Prepare the data payload for the API route
      // Exclude the thumbnail File object, it needs separate handling
      const payload: Omit<z.infer<typeof formSchema>, 'thumbnail'> & { author_id?: string, metadata?: any } = {
        title: values.title,
        type: values.type,
        published: values.published,
        accessTierId: values.accessTierId,
        ageGroups: values.ageGroups,
        categories: values.categories,
        metadata: {
          attachments: attachments
        }
      };
      
      console.log("Sending payload to API:", payload);
      
      // Get auth token for the API request header
      const token = localStorage.getItem('supabase_access_token');

      // --- ADDED DEBUG LOG --- 
      console.log('%%% PREPARING TO FETCH /api/manage/content %%%');
      
      // Call the API route
      const response = await fetch('/api/manage/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '' // Include token
        },
        body: JSON.stringify(payload),
      });

      // --- ADDED DEBUG LOG --- 
      console.log(`%%% FETCH Response Status: ${response.status} %%%`);

      const result = await response.json();

      if (!response.ok) {
        console.error("API error creating content:", result);
        throw new Error(result.error || `API request failed with status ${response.status}`);
      }

      if (!result.contentId) {
         throw new Error("API succeeded but did not return a content ID.");
      }
      
      const contentId = result.contentId;
      console.log("Content created via API, ID:", contentId);

      // Step 4: Upload thumbnail if provided (using a separate API route or direct client upload)
      if (values.thumbnail instanceof File) {
          console.log('Thumbnail provided, needs to be uploaded separately for content ID:', contentId);
          
          try {
              // Upload thumbnail using our API endpoint
              const formData = new FormData();
              formData.append('file', values.thumbnail);
              formData.append('type', 'thumbnail');
              
              // Get auth token
              const token = localStorage.getItem('supabase_access_token');
              
              // Use our API endpoint to upload the thumbnail
              const uploadResponse = await fetch('/api/manage/upload-image', {
                  method: 'POST',
                  headers: {
                      'Authorization': token ? `Bearer ${token}` : ''
                  },
                  body: formData
              });
              
              if (!uploadResponse.ok) {
                  const errorData = await uploadResponse.json();
                  console.error('Error uploading thumbnail:', errorData);
                  // Continue without throwing - we'll just use the editor without a thumbnail
              } else {
                  const uploadResult = await uploadResponse.json();
                  
                  if (uploadResult.url) {
                      console.log('Thumbnail uploaded successfully:', uploadResult.url);
                      
                      // Update the content record with the thumbnail URL
                      const updateResponse = await fetch(`/api/manage/content/${contentId}`, {
                          method: 'PATCH',
                          headers: {
                              'Content-Type': 'application/json',
                              'Authorization': token ? `Bearer ${token}` : ''
                          },
                          body: JSON.stringify({
                              thumbnail_url: uploadResult.url
                          })
                      });
                      
                      if (!updateResponse.ok) {
                          console.error('Error updating content with thumbnail URL:', await updateResponse.json());
                      }
                  }
              }
          } catch (uploadError) {
              console.error('Thumbnail upload failed:', uploadError);
              // Continue without thumbnail if upload fails
          }
      }
      
      // Show success message
      toast({
        title: "Content created successfully",
        description: "Redirecting to content editor to add the content body",
      })
      
      // Navigate to content editor to edit the content body
      const editorUrl = `/manage/content/editor/${contentId}`;
      console.log('Redirecting to content editor:', editorUrl);
      console.log('Current authentication state:', { isAuthenticated, loading });
      
      // Use a slight delay to ensure the toast is shown before redirecting
      setTimeout(() => {
        console.log('Executing redirect to:', editorUrl);
        router.push(editorUrl);
      }, 1000);
      
    } catch (err) {
      // --- ADDED DEBUG LOG --- 
      console.log('%%% ERROR caught in onSubmit %%%', err);
      console.error("Error creating content:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create content";
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: "Failed to create content. Please try again.",
        variant: "destructive"
      })
    } finally {
      // --- ADDED DEBUG LOG --- 
      console.log('%%% FINALLY block in onSubmit %%%');
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
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>
      <div className="container py-8">
        <PageHeader
          title="Create New Content"
          backUrl="/"
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
                    <FormMessage />
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
                        id="published"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="published">
                        Publish immediately
                      </FormLabel>
                      <FormDescription>
                        Content will be visible to users based on the selected access tier
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Attachments */}
              <div className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold">Attachments</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Add files that users can download
                </p>
                
                <FileAttachmentsUploader
                  initialAttachments={attachments}
                  onAttachmentsChange={setAttachments}
                  onUploadingChange={setAttachmentsUploading}
                />
              </div>
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