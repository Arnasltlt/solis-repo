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
import { SparklesIcon, CheckIcon, ChevronRightIcon, ArrowLeft, Loader2, Edit, Save } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckboxCardGroup } from '@/components/ui/checkbox-card-group'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth, UserRoles } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { ContentItem } from '@/lib/types/database'
import { updateContent } from '@/lib/services/content'
import { SimpleAttachmentUploader } from '@/components/content/simplified-attachment-uploader'
import type { SimpleAttachment } from '@/components/content/simplified-attachment-uploader'

// Create a schema for content editing
const formSchema = z.object({
  type: z.enum(['video', 'audio', 'lesson_plan', 'game'], {
    required_error: "Please select a content type",
  }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  ageGroups: z.array(z.string()).min(1, { message: "Please select at least one age group" }),
  categories: z.array(z.string()).min(1, { message: "Please select at least one category" }),
  accessTierId: z.string().min(1, { message: "Please select an access tier" }),
  published: z.boolean().default(false),
  thumbnail: z.any().optional(),
})

interface EditContentFormProps {
  content: ContentItem
  ageGroups: any[]
  categories: any[]
  accessTiers: any[]
}

export function EditContentForm({ 
  content,
  ageGroups, 
  categories, 
  accessTiers 
}: EditContentFormProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const { isAdmin } = useAuthorization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(content.thumbnail_url || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<SimpleAttachment[]>(
    (content.metadata && Array.isArray(content.metadata.attachments)) 
      ? content.metadata.attachments.map(a => ({
          id: a.id || String(Date.now()),
          url: a.url || '',
          fileName: a.fileName || a.name || 'file',
          fileSize: a.fileSize || a.size || 0
        }))
      : []
  )
  
  // Check authentication directly
  useEffect(() => {
    if (loading) return
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access content editing',
        variant: 'destructive'
      })
      router.push(`/login?callbackUrl=/manage/content/edit/${content.id}`)
      return
    }
    
    // If authenticated but not admin, redirect home
    if (isAuthenticated && !isAdmin()) {
      toast({
        title: 'Access denied',
        description: 'You need administrator access to edit content',
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
  }, [isAuthenticated, loading, user, isAdmin, router, content.id])
  
  // Define form with content values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: content.type as any,
      title: content.title,
      description: content.description || "",
      ageGroups: content.age_groups.map(ag => ag.id),
      categories: content.categories.map(cat => cat.id),
      accessTierId: content.access_tier?.id || "",
      published: content.published,
    },
  })
  
  // Add handleThumbnailChange function
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
    
    // Set the file in the form and state
    form.setValue('thumbnail', file)
    setSelectedFile(file)
    form.clearErrors('thumbnail')
    
    // If there was a previous preview from local file (not URL), revoke it
    if (previewUrl && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl)
    }
    
    // Create a preview URL
    setPreviewUrl(URL.createObjectURL(file))
  }
  
  // Add clearThumbnail function
  const clearThumbnail = () => {
    form.setValue('thumbnail', null)
    setSelectedFile(null)
    
    // If there was a preview from local file (not URL), revoke it
    if (previewUrl && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl)
    }
    
    // Reset to original thumbnail URL or null
    setPreviewUrl(content.thumbnail_url || null)
  }
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!supabase) {
      setError("Database connection not available")
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      console.log("Updating content with values:", values)
      
      // Verify that we have a valid user session before proceeding
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session?.user?.id) {
        throw new Error("No authenticated user found. Please log in again.")
      }
      
      // Get auth token
      const token = localStorage.getItem('supabase_access_token');
      
      // First check if there's a new thumbnail to upload
      let thumbnailUrl = content.thumbnail_url;
      
      if (values.thumbnail instanceof File) {
        try {
          // Upload thumbnail using our API endpoint
          const formData = new FormData();
          formData.append('file', values.thumbnail);
          formData.append('type', 'thumbnail');
          
          console.log('Uploading thumbnail via API endpoint');
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
            throw new Error(errorData.error || 'Failed to upload thumbnail');
          } else {
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.url) {
              console.log('Thumbnail uploaded successfully:', uploadResult.url);
              thumbnailUrl = uploadResult.url;
              
              // Use the dedicated thumbnail update endpoint instead of updateContent
              console.log('Updating thumbnail URL via dedicated API endpoint');
              const thumbnailUpdateResponse = await fetch(`/api/manage/content/${content.id}/thumbnail`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                  thumbnail_url: uploadResult.url
                })
              });
              
              if (!thumbnailUpdateResponse.ok) {
                const thumbnailError = await thumbnailUpdateResponse.json();
                console.error('Error updating thumbnail URL via API:', thumbnailError);
                throw new Error(thumbnailError.error || 'Failed to update thumbnail URL');
              }
              
              console.log('Thumbnail URL updated successfully via API');
            }
          }
        } catch (uploadError) {
          console.error('Thumbnail upload or update failed:', uploadError);
          // Continue with update, but show warning
          toast({
            title: "Warning",
            description: "Content details updated but thumbnail upload failed. Please try again later.",
            variant: "destructive"
          });
        }
      }
      
      // Update the content metadata using the API endpoint instead of updateContent function
      console.log('Updating content metadata via API endpoint');
      
      // Prepare the update payload
      const updatePayload = {
        title: values.title,
        description: values.description,
        type: values.type,
        age_groups: values.ageGroups,
        categories: values.categories,
        access_tier_id: values.accessTierId,
        published: values.published,
        metadata: {
          ...(content.metadata || {}),
          attachments: attachments
        }
      };
      
      // Use the content update API endpoint
      const contentUpdateResponse = await fetch(`/api/manage/content/${content.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!contentUpdateResponse.ok) {
        const contentUpdateError = await contentUpdateResponse.json();
        console.error('Error updating content via API:', contentUpdateError);
        throw new Error(contentUpdateError.error || 'Failed to update content details');
      }
      
      console.log('Content metadata updated successfully via API');
      
      // Show success message
      toast({
        title: "Content updated",
        description: "Content details have been updated successfully",
      })
      
      // Navigate to the content editor page to edit content body
      router.push(`/manage/content/editor/${content.id}`)
      
    } catch (err) {
      console.error("Error updating content:", err)
      
      // Display error message
      const errorMessage = err instanceof Error ? err.message : "Failed to update content";
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: "Failed to update content. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>
      <div className="container py-8">
        <PageHeader
          title="Edit Content"
          backUrl="/manage"
        />
        
        <div className="flex justify-end mb-6">
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href="/manage">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/manage/content/editor/${content.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Content Body
              </Link>
            </Button>
          </div>
        </div>
        
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
                      <Input {...field} />
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
            </div>
            
            {/* Add Thumbnail field */}
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
                          {selectedFile && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={clearThumbnail}
                            >
                              Remove
                            </Button>
                          )}
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
                        Published
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
                <h2 className="text-lg font-semibold">Priedai</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pridėkite failus, kuriuos vartotojai galės atsisiųsti
                </p>
                
                <SimpleAttachmentUploader
                  initialAttachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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