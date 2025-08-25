// useContentEditor.ts - Centralized hook for content editing
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { SupabaseClient } from '@supabase/supabase-js'
import { 
  getContentById, 
  updateContent, 
  createContent 
} from '@/lib/services/content'
import type { ContentFormData, ContentType } from '@/lib/types/content'
import type { ContentItem, Database } from '@/lib/types/database'

// Local storage key for content draft
const CONTENT_DRAFT_KEY = 'content-form-draft'

interface UseContentEditorProps {
  contentId?: string
  supabase?: SupabaseClient<Database>
}

interface UseContentEditorReturn {
  // Form data and state
  formData: ContentFormData | null
  isLoading: boolean
  error: string | null
  
  // Actions
  saveContentDraft: (data: ContentFormData) => void
  clearContentDraft: () => void
  submitContent: (data: ContentFormData) => Promise<void>
  
  // Content state
  isEditMode: boolean
}

/**
 * Custom hook to manage content editing state and operations
 */
export function useContentEditor({ 
  contentId, 
  supabase 
}: UseContentEditorProps): UseContentEditorReturn {
  const router = useRouter()
  const [formData, setFormData] = useState<ContentFormData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState<boolean>(!!contentId)
  
  // Keep track of which contentId we've already loaded
  const loadedContentId = useRef<string | null>(null)
  
  // Reset content when ID changes to undefined/null
  useEffect(() => {
    if (!contentId) {
      console.log('Content ID is null/undefined, clearing edit mode')
      setIsEditMode(false)
      loadedContentId.current = null
      
      // Check if we're coming from edit mode to create mode
      if (loadedContentId.current !== null) {
        console.log('Switching from edit mode to create mode, clearing draft')
        localStorage.removeItem(CONTENT_DRAFT_KEY)
        // Initialize with empty form data
        setFormData({
          type: 'video' as ContentType,
          title: '',
          ageGroups: [],
          categories: [],
          accessTierId: '',
          contentBody: '',
          published: false,
          thumbnail: null
        })
        return
      }
      
      // Load draft for new content if available
      const savedData = loadContentDraftFromStorage()
      if (savedData && !formData) {
        console.log('Loading existing draft for new content')
        // Ensure thumbnail is properly handled
        // Note: File objects can't be serialized to localStorage, so thumbnail will be null here
        setFormData({
          ...savedData,
          thumbnail: null // Reset thumbnail when loading from localStorage
        })
      } else if (!formData) {
        // Initialize with empty form data if no draft
        console.log('Initializing empty form data for new content')
        setFormData({
          type: 'video' as ContentType,
          title: '',
          ageGroups: [],
          categories: [],
          accessTierId: '',
          contentBody: '',
          published: false,
          thumbnail: null
        })
      }
    } else if (contentId !== loadedContentId.current) {
      console.log(`Content ID changed from ${loadedContentId.current} to ${contentId}`)
      setIsEditMode(true)
      // Will trigger the content loading effect
    }
  }, [contentId, formData])
  
  // Load content data when editing existing content
  useEffect(() => {
    async function loadContentData() {
      // Only load if we have a new contentId that we haven't loaded yet
      if (!contentId || !supabase || loadedContentId.current === contentId) return
      
      console.log(`Loading content data for ID: ${contentId} (previously loaded: ${loadedContentId.current})`)
      
      try {
        setIsLoading(true)
        setError(null)
        console.log('Fetching content from database:', contentId)
        
        const content = await getContentById(contentId, supabase)
        if (!content) {
          throw new Error('Content not found')
        }
        
        console.log('Content loaded from database:', {
          id: content.id,
          title: content.title,
          hasContentBody: !!content.content_body,
          contentBodyLength: content.content_body?.length || 0
        })
        
        // Map database content to form data format
        const mappedFormData: ContentFormData = {
          type: content.type,
          title: content.title,
          ageGroups: content.age_groups.map((ag: any) => ag.id),
          categories: content.categories.map((c: any) => c.id),
          accessTierId: content.access_tier_id,
          contentBody: content.content_body || '',
          published: content.published,
          thumbnail: content.thumbnail_url
        }
        
        // Validate content body - make sure it's never the literal string "contentBody"
        if (mappedFormData.contentBody === 'contentBody') {
          console.warn('Content body is the literal string "contentBody", replacing with empty string')
          mappedFormData.contentBody = ''
        }
        
        // Save to state and localStorage
        setFormData(mappedFormData)
        saveContentDraftToStorage(mappedFormData)
        setIsEditMode(true)
        
        // Mark this content as loaded
        loadedContentId.current = contentId
      } catch (err) {
        console.error('Error loading content:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load content'
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content for editing",
        })
        
        // Reset loaded content ID so we can try again
        loadedContentId.current = null
      } finally {
        setIsLoading(false)
      }
    }
    
    loadContentData()
  }, [contentId, supabase])
  
  // Try to load from localStorage on initial mount
  useEffect(() => {
    if (!formData && !isLoading) {
      const savedData = loadContentDraftFromStorage()
      if (savedData) {
        console.log('Loaded draft from localStorage:', {
          title: savedData.title,
          hasContentBody: !!savedData.contentBody,
          contentBodyLength: savedData.contentBody?.length || 0
        })
        setFormData(savedData)
      }
    }
  }, [formData, isLoading])
  
  /**
   * Save content draft to localStorage
   */
  const saveContentDraftToStorage = (data: ContentFormData) => {
    if (!data) return
    
    try {
      // Create a copy of the data without the thumbnail
      // File objects can't be serialized to localStorage
      const dataForStorage = {
        ...data,
        thumbnail: null // Don't try to store File objects in localStorage
      };
      
      console.log('Saving content draft to localStorage:', {
        title: data.title,
        hasContentBody: !!data.contentBody,
        contentBodyLength: data.contentBody?.length || 0,
        thumbnailRemoved: !!data.thumbnail
      })
      localStorage.setItem(CONTENT_DRAFT_KEY, JSON.stringify(dataForStorage))
    } catch (err) {
      console.error('Error saving draft to localStorage:', err)
    }
  }
  
  /**
   * Load content draft from localStorage
   */
  const loadContentDraftFromStorage = (): ContentFormData | null => {
    try {
      const saved = localStorage.getItem(CONTENT_DRAFT_KEY)
      if (!saved) return null
      
      const parsed = JSON.parse(saved) as ContentFormData
      
      // Validate content body - make sure it's never the literal string "contentBody"
      if (parsed.contentBody === 'contentBody') {
        console.warn('Content body from localStorage is the literal string "contentBody", replacing with empty string')
        parsed.contentBody = ''
      }
      
      return parsed
    } catch (err) {
      console.error('Error loading draft from localStorage:', err)
      return null
    }
  }
  
  /**
   * Save content draft (to both state and localStorage)
   */
  const saveContentDraft = useCallback((data: ContentFormData) => {
    setFormData(data)
    saveContentDraftToStorage(data)
  }, [])
  
  /**
   * Clear content draft from localStorage and state
   */
  const clearContentDraft = useCallback(() => {
    try {
      localStorage.removeItem(CONTENT_DRAFT_KEY)
      setFormData(null)
      
      // Reset loaded content ID when clearing draft
      loadedContentId.current = null
    } catch (err) {
      console.error('Error clearing content draft:', err)
    }
  }, [])
  
  /**
   * Submit content (create or update)
   */
  const submitContent = useCallback(async (data: ContentFormData) => {
    if (!supabase) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize database client",
      })
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Prepare a clean version of the data
      // Make a deep copy to avoid modifying the original
      const cleanData: ContentFormData = JSON.parse(JSON.stringify(data))
      
      // Make sure contentBody is not the literal string "contentBody"
      if (cleanData.contentBody === 'contentBody') {
        console.warn('Replacing literal "contentBody" with empty string')
        cleanData.contentBody = ''
      } else {
        console.log('Content body ready for submission:', {
          type: typeof cleanData.contentBody,
          length: cleanData.contentBody?.length || 0,
          preview: cleanData.contentBody?.substring(0, 50) || ''
        })
      }
      
      // Log what we're about to do
      console.log(contentId ? 'Updating existing content' : 'Creating new content', {
        contentId: contentId || 'none',
        dataKeys: Object.keys(cleanData),
        hasContentBody: !!cleanData.contentBody,
        hasThumbnail: !!cleanData.thumbnail,
        thumbnailType: cleanData.thumbnail ? typeof cleanData.thumbnail : 'none',
        thumbnailIsFile: cleanData.thumbnail instanceof File,
        thumbnailDetails: cleanData.thumbnail instanceof File ? {
          name: cleanData.thumbnail.name,
          size: cleanData.thumbnail.size,
          type: cleanData.thumbnail.type
        } : 'not a file'
      })
      
      // Update or create content
      if (contentId) {
        await updateContent(contentId, cleanData, supabase)
        toast({
          title: "Content updated",
          description: "Your content has been successfully updated",
        })
      } else {
        await createContent(cleanData, supabase)
        toast({
          title: "Content created",
          description: "Your content has been successfully created",
        })
      }
      
      // Clear draft and redirect
      clearContentDraft()
      router.replace('/manage/content?tab=list')
    } catch (err) {
      console.error('Error submitting content:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save content'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }, [contentId, supabase, clearContentDraft, router])
  
  return {
    formData,
    isLoading,
    error,
    saveContentDraft,
    clearContentDraft, 
    submitContent,
    isEditMode
  }
} 