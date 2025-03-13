'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'

// Dynamically import the editor to avoid SSR issues
const Editor = dynamic(() => import('@/components/editor/editor-wrapper').then(mod => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="min-h-[300px] rounded-md border flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Loading editor...</p>
    </div>
  )
})

interface ContentEditorProps {
  contentId: string
  initialContent: string
}

export function ContentEditor({ contentId, initialContent }: ContentEditorProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { isAdmin } = useAuthorization()
  const [editorContent, setEditorContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Check authentication directly
  useEffect(() => {
    if (isLoading) return
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access content editor',
        variant: 'destructive'
      })
      router.push(`/login?callbackUrl=/manage/content/editor/${contentId}`)
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
    
    console.log('Editor auth verified:', { 
      email: user?.email,
      isAuthenticated,
      isAdmin: isAdmin()
    })
  }, [isAuthenticated, isLoading, user, isAdmin, router, contentId])
  
  // Set initial content
  useEffect(() => {
    // Process the initial content - handle different formats
    let processedContent = initialContent
    
    // If the content is empty, start with something
    if (!initialContent || initialContent === '') {
      processedContent = '<p>Start editing your content here...</p>'
    } else {
      // Try to see if it's JSON format
      try {
        // If it parses as JSON, keep it as is (it's likely ProseMirror JSON)
        JSON.parse(initialContent)
        processedContent = initialContent
      } catch (e) {
        // If not JSON, it's probably HTML, so keep as is
      }
    }
    
    setEditorContent(processedContent)
  }, [initialContent])
  
  // Auto-save feature
  const [lastSavedContent, setLastSavedContent] = useState<string>('')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  
  // Handle editor changes with local storage backup
  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content)
    
    // Save content to localStorage as a backup
    try {
      localStorage.setItem(`editor-backup-${contentId}`, content)
      localStorage.setItem(`editor-backup-${contentId}-timestamp`, Date.now().toString())
    } catch (e) {
      console.warn('Failed to save editor content to localStorage:', e)
    }
  }, [contentId])
  
  // Check for localStorage backups on editor initialization
  useEffect(() => {
    if (contentId && (!initialContent || initialContent.length < 20)) {
      try {
        const backup = localStorage.getItem(`editor-backup-${contentId}`)
        const backupTimestamp = localStorage.getItem(`editor-backup-${contentId}-timestamp`)
        
        if (backup && backupTimestamp && backup.length > 50) {
          const backupTime = new Date(parseInt(backupTimestamp))
          const now = new Date()
          const hoursSinceBackup = (now.getTime() - backupTime.getTime()) / (1000 * 60 * 60)
          
          // Only offer to restore backups less than 24 hours old
          if (hoursSinceBackup < 24) {
            const shouldRestore = window.confirm(
              `Found an unsaved draft from ${backupTime.toLocaleString()}. Would you like to restore it?`
            )
            
            if (shouldRestore) {
              setEditorContent(backup)
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore editor backup:', e)
      }
    }
  }, [contentId, initialContent])
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !editorContent || editorContent === lastSavedContent || !supabase) {
      return
    }
    
    // Only auto-save if content is substantial (avoid saving empty or minimal content)
    if (editorContent.length < 50) {
      return
    }
    
    // Use a debounced auto-save
    const autoSaveTimer = setTimeout(async () => {
      try {
        // Skip auto-save if user is actively saving
        if (isSaving) return
        
        console.log('Auto-saving content...')
        
        const { error } = await supabase
          .from('content_items')
          .update({
            content_body: editorContent
          })
          .eq('id', contentId)
        
        if (error) {
          console.error('Error auto-saving content:', error)
          return
        }
        
        setLastSavedContent(editorContent)
        setLastAutoSave(new Date())
        console.log('Auto-save successful at', new Date().toLocaleTimeString())
      } catch (error) {
        console.error('Error during auto-save:', error)
      }
    }, 10000) // Auto-save after 10 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer)
  }, [editorContent, lastSavedContent, contentId, supabase, autoSaveEnabled, isSaving])
  
  // Save content with retry logic
  const saveContent = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSaving(true)
      
      // Log what we're going to save
      console.log(`Saving content for ID: ${contentId}, content length: ${editorContent.length}`)
      
      // Auto-retry mechanism
      let retries = 0
      const maxRetries = 3
      let savedSuccessfully = false
      
      while (retries < maxRetries && !savedSuccessfully) {
        try {
          // Update the content body in the database
          const { error } = await supabase
            .from('content_items')
            .update({
              content_body: editorContent
            })
            .eq('id', contentId)
          
          if (error) {
            console.error(`Save attempt ${retries + 1} failed:`, error)
            retries++
            
            // Wait before retrying (exponential backoff)
            if (retries < maxRetries) {
              const delayMs = 1000 * Math.pow(2, retries)
              console.log(`Retrying in ${delayMs}ms...`)
              await new Promise(resolve => setTimeout(resolve, delayMs))
            } else {
              throw error
            }
          } else {
            savedSuccessfully = true
            setLastSavedContent(editorContent)
            
            // Clear the backup since we've saved successfully
            localStorage.removeItem(`editor-backup-${contentId}`)
            localStorage.removeItem(`editor-backup-${contentId}-timestamp`)
          }
        } catch (innerError) {
          console.error(`Inner error on save attempt ${retries + 1}:`, innerError)
          retries++
          
          if (retries >= maxRetries) {
            throw innerError
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)))
        }
      }
      
      console.log('Content saved successfully')
      
      toast({
        title: "Content saved",
        description: "Your content has been saved successfully"
      })
      
      // Automatically redirect to homepage after saving
      router.push('/')
    } catch (error) {
      console.error('Error saving content:', error)
      
      // More detailed error message
      const errorMessage = error instanceof Error 
        ? error.message
        : "Unknown error when saving";
        
      toast({
        title: "Error saving content",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle going back to homepage
  const handleBack = () => {
    router.push('/')
  }
  
  // Add keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!isSaving) {
          saveContent()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving])
  
  return (
    <ProtectedRoute requiredRole="administrator">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Label className="text-lg">Content Editor</Label>
              {lastAutoSave && (
                <span className="text-xs text-gray-500">
                  Auto-saved: {lastAutoSave.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="space-x-2 flex items-center">
              <div className="mr-4 flex items-center">
                <input
                  type="checkbox"
                  id="autoSaveToggle"
                  checked={autoSaveEnabled}
                  onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  className="mr-2"
                />
                <label htmlFor="autoSaveToggle" className="text-sm">Auto-save</label>
              </div>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
                type="button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={saveContent}
                disabled={isSaving}
                type="button"
                title="Save (Ctrl+S)"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="min-h-[500px] border rounded-md">
            <Editor
              initialData={editorContent}
              onChange={handleContentChange}
              fullscreen={isFullscreen}
              setFullscreen={setIsFullscreen}
            />
          </div>
          
          <div className="text-xs text-gray-500 flex justify-between">
            <div>
              Content length: {editorContent.length} characters
            </div>
            <div>
              Keyboard shortcuts: Ctrl+S to save
            </div>
          </div>
        </div>
      </Card>
    </ProtectedRoute>
  )
}