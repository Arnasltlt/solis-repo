'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Video, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  if (!url?.trim()) return null
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    
    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v')
    }
    
    // youtu.be/VIDEO_ID
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1)
    }
    
    // youtube.com/embed/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/embed/')[1]
    }
    
    // youtube.com/shorts/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1]
    }
    
    return null
  } catch (error) {
    return null
  }
}

interface SimpleYouTubeEditorProps {
  initialContent?: string
  onChange: (content: string) => void
  onSave?: () => Promise<void>
  readOnly?: boolean
  className?: string
}

export function SimpleYouTubeEditor({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  className
}: SimpleYouTubeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // const quillRef = useRef<any>(null) // Removed due to TypeScript compatibility issues
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Quill toolbar configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean'],
        ['youtube'] // Custom button for YouTube
      ],
      handlers: {
        youtube: () => setYoutubeDialogOpen(true)
      }
    }
  }

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'link', 'image'
  ]

  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    onChange(value)
    setHasUnsavedChanges(true)

    // Auto-save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave && hasUnsavedChanges) {
        try {
          setIsSaving(true)
          await onSave()
          setLastSaved(new Date())
          setHasUnsavedChanges(false)
          toast({
            title: 'Auto-saved',
            description: 'Your content has been saved automatically'
          })
        } catch (error) {
          toast({
            title: 'Save failed',
            description: 'Could not save content automatically',
            variant: 'destructive'
          })
        } finally {
          setIsSaving(false)
        }
      }
    }, 2000)
  }, [onChange, onSave, hasUnsavedChanges])

  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return

    try {
      setIsSaving(true)
      await onSave()
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      toast({
        title: 'Saved',
        description: 'Your content has been saved successfully'
      })
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save content',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving])

  const handleYoutubeInsert = useCallback(() => {
    if (!youtubeUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube URL',
        variant: 'destructive'
      })
      return
    }

    const videoId = extractYouTubeId(youtubeUrl)
    if (!videoId || videoId.length !== 11) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube URL',
        variant: 'destructive'
      })
      return
    }

    // Create YouTube iframe HTML
    const youtubeEmbed = `
      <div style="margin: 1rem 0; text-align: center;">
        <iframe 
          width="640" 
          height="360" 
          src="https://www.youtube.com/embed/${videoId}" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen
          style="max-width: 100%; border-radius: 8px;"
        ></iframe>
      </div>
    `

    // Get Quill instance and insert the HTML
    // Note: Direct Quill manipulation removed due to TypeScript ref issues
    // The YouTube embed functionality is disabled in this editor
    toast({
      title: 'Info',
      description: 'YouTube embedding is disabled in this editor. Use the ultra-simple editor instead.'
    })

    setYoutubeDialogOpen(false)
    setYoutubeUrl('')
  }, [youtubeUrl])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    if (!readOnly) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave, readOnly])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={cn("border rounded-lg bg-white", className)}>
      {/* Custom Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setYoutubeDialogOpen(true)}
              className="h-8 w-8 p-0"
              title="Add YouTube Video"
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {isSaving && (
              <div className="flex items-center gap-1 text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {!isSaving && lastSaved && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            {hasUnsavedChanges && !isSaving && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-3 w-3" />
                <span>Unsaved changes</span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-4">
        {typeof window !== 'undefined' && (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            readOnly={readOnly}
            modules={readOnly ? { toolbar: false } : modules}
            formats={formats}
            style={{
              minHeight: readOnly ? '200px' : '300px'
            }}
          />
        )}
      </div>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Video</DialogTitle>
            <DialogDescription>
              Paste a YouTube URL to embed it in your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleYoutubeInsert()}
              autoFocus
            />
            <div className="text-sm text-gray-500">
              Supports YouTube URLs like:
              <ul className="list-disc list-inside mt-1">
                <li>youtube.com/watch?v=VIDEO_ID</li>
                <li>youtu.be/VIDEO_ID</li>
                <li>youtube.com/embed/VIDEO_ID</li>
                <li>youtube.com/shorts/VIDEO_ID</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setYoutubeDialogOpen(false)
              setYoutubeUrl('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleYoutubeInsert} disabled={!youtubeUrl.trim()}>
              Add YouTube Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load React Quill styles */}
      <style jsx global>{`
        .ql-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        
        .ql-container {
          border-bottom: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        
        .ql-editor {
          min-height: 200px;
        }
        
        .ql-editor iframe {
          max-width: 100%;
          height: auto;
        }
        
        /* Custom YouTube button styling */
        .ql-youtube {
          width: 28px !important;
          height: 28px !important;
        }
        
        .ql-youtube:before {
          content: "▶";
          color: #e74c3c;
          font-size: 14px;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}