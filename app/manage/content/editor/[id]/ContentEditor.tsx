'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth, UserRoles } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { isBrowser } from '@/lib/utils/index'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { getAgeGroups, getCategories, getAccessTiers, getContentById, updateContent } from '@/lib/services/content'

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
  const { userRole, loading: authLoading } = useAuth()
  const { isAdmin, canManageContent } = useAuthorization()
  const [editorContent, setEditorContent] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  

  
  // Set initial content
  useEffect(() => {
    // Process the initial content - handle different formats
    let processedContent = initialContent

    // If the content is empty or just the placeholder, start with an empty string
    if (
      !initialContent ||
      initialContent === '' ||
      initialContent.trim() === '<p>Start editing your content here...</p>'
    ) {
      processedContent = ''
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
    if (isBrowser()) {
      try {
        localStorage.setItem(`editor-backup-${contentId}`, content)
        localStorage.setItem(`editor-backup-${contentId}-timestamp`, Date.now().toString())
      } catch (e) {
        console.warn('Failed to save editor content to localStorage:', e)
      }
    }
  }, [contentId])
  
  // Check for localStorage backups on editor initialization
  useEffect(() => {
    if (!isBrowser() || !contentId || (!initialContent || initialContent.length < 20)) {
      return;
    }
    
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
  }, [contentId, initialContent])
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !editorContent || editorContent === lastSavedContent) {
      return
    }
    
    // Only auto-save if content is substantial (avoid saving empty or minimal content)
    if (editorContent.length < 50) {
      return
    }
    
    // Use a debounced auto-save
    const autoSaveTimer = setTimeout(async () => {
      try {
        if (isSaving) return

        
        // Get auth token for the API request header
        let token = ''
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession()
          token = session?.access_token || ''
        }
        
        const response = await fetch(`/api/manage/content/${contentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            content_body: editorContent
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error auto-saving content:', errorData);
          return;
        }
        
        setLastSavedContent(editorContent)
        setLastAutoSave(new Date())

      } catch (error) {
        console.error('Error during auto-save:', error)
      }
    }, 10000)
    
    return () => clearTimeout(autoSaveTimer)
  }, [editorContent, lastSavedContent, contentId, autoSaveEnabled, isSaving, supabase])
  
  // Save content with retry logic
  const saveContent = async () => {
    try {
      setIsSaving(true)

      
      // Get auth token for the API request header
      let token = ''
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token || ''
      }
      
      let retries = 0
      const maxRetries = 3
      let savedSuccessfully = false
      
      while (retries < maxRetries && !savedSuccessfully) {
        try {
          const response = await fetch(`/api/manage/content/${contentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content_body: editorContent
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Save attempt ${retries + 1} failed:`, errorData);
            retries++;
            
            // Wait before retrying (exponential backoff)
            if (retries < maxRetries) {
              const delayMs = 1000 * Math.pow(2, retries);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
              throw new Error(errorData.error || 'Failed to save content');
            }
          } else {
            savedSuccessfully = true
            setLastSavedContent(editorContent)
            
            // Clear the backup since we've saved successfully
            if (isBrowser()) {
              localStorage.removeItem(`editor-backup-${contentId}`)
              localStorage.removeItem(`editor-backup-${contentId}-timestamp`)
            }
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
      

      
      toast({
        title: "Content saved",
        description: "Your content has been saved successfully"
      })
      
      // Redirect to homepage after saving
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
  
  // Handle going back to content management
  const handleBack = () => {
    router.push('/manage/content/list')
  }
  
  // Add keyboard shortcut for saving
  useEffect(() => {
    if (!isBrowser()) return;
    
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
  }, [isSaving, saveContent])

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaType, setMetaType] = useState<'video'|'audio'|'lesson_plan'|'game'>('video')
  const [metaAgeGroups, setMetaAgeGroups] = useState<string[]>([])
  const [metaCategories, setMetaCategories] = useState<string[]>([])
  const [metaAccessTier, setMetaAccessTier] = useState<string>('')
  const [metaPublished, setMetaPublished] = useState<boolean>(false)
  const [refAgeGroups, setRefAgeGroups] = useState<any[]>([])
  const [refCategories, setRefCategories] = useState<any[]>([])
  const [refAccessTiers, setRefAccessTiers] = useState<any[]>([])

  const openDetails = async () => {
    try {
      setDetailsOpen(true)
      setDetailsLoading(true)
      // Load refs in parallel
      const [ags, cats, tiers] = await Promise.all([
        getAgeGroups(),
        getCategories(),
        getAccessTiers()
      ])
      setRefAgeGroups(ags || [])
      setRefCategories(cats || [])
      setRefAccessTiers(tiers || [])
      // Load current content snapshot
      const content = await getContentById(contentId)
      if (content) {
        setMetaTitle(content.title || '')
        setMetaDescription(content.description || '')
        setMetaType(content.type)
        setMetaAgeGroups((content.age_groups || []).map((ag: any) => ag.id))
        setMetaCategories((content.categories || []).map((c: any) => c.id))
        setMetaAccessTier(content.access_tier?.id || '')
        setMetaPublished(!!content.published)
      }
    } catch (e) {
      console.error('Failed to load details refs/content', e)
      toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' })
    } finally {
      setDetailsLoading(false)
    }
  }
        setMetaAgeGroups((content.age_groups || []).map((ag: { id: string }) => ag.id))
        setMetaCategories((content.categories || []).map((c: { id: string }) => c.id))
    list.includes(id) ? list.filter(x => x !== id) : [...list, id]
  )

  const saveDetails = async () => {
    try {
      if (!supabase) return
      setIsSaving(true)
      await updateContent(
        contentId,
        {
          title: metaTitle,
          description: metaDescription,
          type: metaType,
          ageGroups: metaAgeGroups,
          categories: metaCategories,
          accessTierId: metaAccessTier,
          published: metaPublished
        },
        supabase
      )
      toast({ title: 'Details saved', description: 'Metadata updated successfully' })
      setDetailsOpen(false)
    } catch (e: any) {
      console.error('Failed to save details', e)
      toast({ title: 'Error', description: e?.message || 'Failed to save details', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRoles.ADMIN}>

      
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
                <div className="relative">
                  <input
                    type="checkbox"
                    id="autoSaveToggle"
                    checked={autoSaveEnabled}
                    onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="autoSaveToggle"
                    className={cn(
                      "flex items-center cursor-pointer p-2 rounded-md transition-colors duration-200",
                      autoSaveEnabled 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2 transition-colors duration-200",
                      autoSaveEnabled ? "bg-green-500" : "bg-gray-400"
                    )} />
                    <span className="text-sm font-medium">
                      Auto-save {autoSaveEnabled ? "ON" : "OFF"}
                    </span>
                  </label>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={openDetails}
                className={cn("text-xs hover:bg-gray-100")}
              >
                Details
              </Button>
              
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
                className="relative overflow-hidden"
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                    <div className="w-16 bg-white/20 h-1 rounded-full overflow-hidden">
                      <div className="bg-white h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
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
            {/* Smart Save Status Indicator */}
            <div className="flex items-center space-x-2 p-3 border-b bg-gray-50">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                editorContent !== lastSavedContent ? "bg-yellow-400 animate-pulse" : "bg-green-400"
              )} />
              <span className="text-xs text-gray-600 font-medium">
                {editorContent !== lastSavedContent ? "Unsaved changes" : "All changes saved"}
              </span>
              {lastAutoSave && (
                <span className="text-xs text-gray-500 ml-auto">
                  Last auto-save: {lastAutoSave.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <Editor
              initialData={editorContent}
              onChange={handleContentChange}
              fullscreen={isFullscreen}
              setFullscreen={setIsFullscreen}
            />
          </div>
          
          {/* Contextual Toolbar Hints */}
          <div className="text-xs text-gray-400 mt-3 text-center p-2 bg-gray-50 rounded-md">
            <span className="font-medium">💡 Pro tip:</span> 
            {editorContent.length > 800 
              ? "Content is getting long - consider adding headings to organize it better" 
              : editorContent.length > 500 
              ? "Great progress! Use headings and lists to structure your content"
              : editorContent.length > 100
              ? "Content is taking shape! Try adding some formatting or media"
              : "Start typing to see formatting options and tips appear here"}
          </div>
          
          {/* Keyboard Shortcut Badges */}
          <div className="flex justify-center space-x-2 mt-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border">
              ⌘S Save
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border">
              ⌘Z Undo
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border">
              ⌘Y Redo
            </span>
          </div>
          
          {/* Floating Action Button for Quick Actions */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="sm"
              className={cn(
                "rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
                "w-12 h-12 p-0",
                editorContent !== lastSavedContent 
                  ? "bg-blue-500 hover:bg-blue-600 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              )}
              onClick={saveContent}
              disabled={isSaving}
              title={editorContent !== lastSavedContent ? "Save changes" : "No changes to save"}
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 flex justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    editorContent.length > 800 ? "bg-red-500" : 
                    editorContent.length > 500 ? "bg-yellow-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min((editorContent.length / 1000) * 100, 100)}%` }}
                />
              </div>
              <span className="text-gray-500">
                {editorContent.length}/1000 chars
              </span>
            </div>
            <div>
              Keyboard shortcuts: Ctrl+S to save
            </div>
          </div>
        </div>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Details</DialogTitle>
            <DialogDescription>Update metadata for this content item.</DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Title</Label>
                <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea rows={3} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Type</Label>
                  <Select value={metaType} onValueChange={v => setMetaType(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                      <SelectItem value="game">Game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Access Tier</Label>
                  <Select value={metaAccessTier} onValueChange={setMetaAccessTier}>
                    <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                    <SelectContent>
                      {refAccessTiers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Age Groups</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {refAgeGroups.map((ag) => (
                    <label key={ag.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={metaAgeGroups.includes(ag.id)} onCheckedChange={() => setMetaAgeGroups(prev => toggleIdIn(prev, ag.id))} />
                      {ag.range}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Categories</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {refCategories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={metaCategories.includes(cat.id)} onCheckedChange={() => setMetaCategories(prev => toggleIdIn(prev, cat.id))} />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="published-toggle" checked={metaPublished} onCheckedChange={(c) => setMetaPublished(!!c)} />
                <Label htmlFor="published-toggle" className="text-sm">Published</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Cancel</Button>
            <Button onClick={saveDetails} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}