'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { updateContentBody } from '@/lib/services/content'
import { uploadImage } from '@/lib/utils/storage-utils'
import type { ContentItem } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Loader2, Save, Image as ImageIcon } from 'lucide-react'
import LexicalEditor from '@/components/lexical/LexicalEditor'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Editor styles are imported in the LexicalEditor component

interface ContentEditorPageProps {
  contentItem: ContentItem;
}

export function ContentEditorPage({ contentItem }: ContentEditorPageProps) {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  
  // Content state
  const [contentBody, setContentBody] = useState(contentItem.content_body || '')
  const [originalContentBody, setOriginalContentBody] = useState(contentItem.content_body || '')
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUploadOpen, setImageUploadOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Check for session on component mount
  useEffect(() => {
    if (!session) {
      console.log('No session found in ContentEditorPage')
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to edit content. Please log in and try again.',
      })
        router.push('/login?callbackUrl=/')
    }
  }, [session, router])
  
  // Ensure content body is properly initialized
  useEffect(() => {
    if (contentItem && contentItem.content_body) {
      setContentBody(contentItem.content_body);
      setOriginalContentBody(contentItem.content_body);
    } else {
      // If content body is null or undefined, initialize with empty string
      setContentBody('');
      setOriginalContentBody('');
    }
  }, [contentItem]);
  
  // Check for unsaved changes
  useEffect(() => {
    setHasChanges(contentBody !== originalContentBody)
  }, [contentBody, originalContentBody])
  
  // Set up auto-save
  useEffect(() => {
    if (hasChanges && !isSaving) {
      // Clear any existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      
      // Set a new timer to auto-save after 5 seconds of inactivity
      const timer = setTimeout(() => {
        handleSave()
      }, 5000)
      
      setAutoSaveTimer(timer)
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [hasChanges, isSaving, contentBody]);
  
  // Handle save
  const handleSave = async (redirectToList = false) => {
    if (!supabase) {
      setError('Supabase client not initialized')
      return
    }

    if (!session) {
      setError('You must be logged in to update content')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      console.log('Saving content body for ID:', contentItem.id)

      // Update content body
      await updateContentBody(contentItem.id, contentBody, supabase)

      // Update original content to reflect saved state
      setOriginalContentBody(contentBody)
      setLastSaved(new Date())
      setHasChanges(false)

      // Show success toast
      toast({
        title: 'Content Saved',
        description: 'Your content has been saved successfully',
      })

        if (redirectToList) {
          router.push('/')
        }
    } catch (error) {
      const errorMsg = `Error saving content: ${error instanceof Error ? error.message : String(error)}`
      setError(errorMsg)

      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg,
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle back navigation
  const handleBack = () => {
    const target = '/'
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return
    }
    router.push(target)
  }
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Image must be less than 5MB',
      })
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only image files are allowed',
      })
      return
    }
    
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }
  
  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) {
      return
    }
    
    try {
      setUploadingImage(true)
      setError(null)
      
      // Upload image using our API endpoint
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('type', 'editor')
      
      // Get auth token
      const token = localStorage.getItem('supabase_access_token')
      
      const response = await fetch('/api/manage/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }
      
      const result = await response.json()
      
      if (!result.url) {
        throw new Error('Upload succeeded but no URL was returned')
      }
      
      // Insert image into editor with proper HTML
      const imageHtml = `<img src="${result.url}" alt="Content image" />`
      setContentBody(prev => prev + imageHtml)
      
      // Close dialog and reset state
      setImageUploadOpen(false)
      setSelectedImage(null)
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
      }
      
      // Mark content as changed
      setHasChanges(true)
      
      toast({
        title: 'Image Uploaded',
        description: 'Image has been added to your content',
      })
    } catch (error) {
      const errorMsg = `Error uploading image: ${error instanceof Error ? error.message : String(error)}`
      setError(errorMsg)
      
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMsg,
      })
    } finally {
      setUploadingImage(false)
    }
  }
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{contentItem.title}</h1>
          <p className="text-gray-500 mt-1">{contentItem.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setImageUploadOpen(true)}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Add Image
          </Button>
          <Button
            variant="default"
            onClick={() => handleSave(true)}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Use the toolbar to format text, add headings, lists, embed videos, and more.
          </p>
        </div>
        {lastSaved && (
          <p className="text-sm text-gray-500">
            Last saved: {new Date(lastSaved).toLocaleTimeString()}
          </p>
        )}
      </div>
      
      <div className="border rounded-md min-h-[calc(100vh-250px)]">
        <LexicalEditor 
          initialContent={contentBody}
          onChange={(newContent) => {
            try {
              setContentBody(newContent);
              setHasChanges(newContent !== originalContentBody);
              // Clear any previous errors when content changes successfully
              if (error) setError(null);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              setError(`Error updating content: ${errorMessage}`);
            }
          }}
        />
      </div>
      
      {/* Image upload dialog */}
      <Dialog open={imageUploadOpen} onOpenChange={setImageUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Upload an image to include in your content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90"
            />
            
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-64 rounded-md mx-auto"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setImageUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImageUpload}
              disabled={!selectedImage || uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 