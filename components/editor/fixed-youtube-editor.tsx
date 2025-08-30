'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Video
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Extract YouTube video ID from URL
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

interface FixedYouTubeEditorProps {
  initialContent?: string
  onChange: (content: string) => void
  onSave?: () => Promise<void>
  readOnly?: boolean
  className?: string
}

export function FixedYouTubeEditor({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  className
}: FixedYouTubeEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastContentRef = useRef('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your content here...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline hover:text-blue-800'
        }
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right']
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
        allowFullscreen: true,
        autoplay: false
      })
    ],
    content: (() => {
      if (!initialContent) return '';
      try {
        const parsed = JSON.parse(initialContent);
        return parsed;
      } catch (e) {
        return initialContent;
      }
    })(),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const jsonString = JSON.stringify(json)
      onChange(jsonString)

      if (jsonString !== lastContentRef.current) {
        setHasUnsavedChanges(true)
        lastContentRef.current = jsonString

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
      }
    }
  })

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

  const handleImageInsert = useCallback(() => {
    if (!imageUrl.trim()) return

    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setImageDialogOpen(false)
    toast({ title: 'Image added', description: 'Image has been inserted into your content' })
  }, [editor, imageUrl])

  const handleLinkInsert = useCallback(() => {
    if (!linkUrl.trim()) return

    const text = linkText.trim() || linkUrl
    editor?.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`).run()
    setLinkUrl('')
    setLinkText('')
    setLinkDialogOpen(false)
    toast({ title: 'Link added', description: 'Link has been inserted into your content' })
  }, [editor, linkUrl, linkText])

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

    console.log('Embedding YouTube video with ID:', videoId)
    console.log('Full URL for embedding:', youtubeUrl)

    try {
      // Use the standard YouTube watch URL format
      const embedUrl = `https://www.youtube.com/watch?v=${videoId}`
      
      // Insert the YouTube video using the command
      const result = editor?.commands.setYoutubeVideo({
        videoId: videoId,
        width: 640,
        height: 360
      })

      console.log('YouTube embed command result:', result)

      if (result) {
        // Add a paragraph after for better UX
        setTimeout(() => {
          editor?.commands.insertContent('<p></p>')
        }, 100)
        
        toast({
          title: 'Success!',
          description: 'YouTube video has been embedded successfully'
        })
      } else {
        throw new Error('Failed to embed video')
      }
    } catch (error) {
      console.error('Error embedding YouTube video:', error)
      toast({
        title: 'Embedding failed',
        description: 'Could not embed the YouTube video',
        variant: 'destructive'
      })
      return
    }

    setYoutubeDialogOpen(false)
    setYoutubeUrl('')
  }, [editor, youtubeUrl])

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

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading editor...</span>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-white", className)}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-3 border-b bg-gray-50">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('bold') && "bg-blue-100 text-blue-700"
              )}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('italic') && "bg-blue-100 text-blue-700"
              )}
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                "h-8 px-2 text-sm",
                editor.isActive('heading', { level: 1 }) && "bg-blue-100 text-blue-700"
              )}
            >
              H1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                "h-8 px-2 text-sm",
                editor.isActive('heading', { level: 2 }) && "bg-blue-100 text-blue-700"
              )}
            >
              H2
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('bulletList') && "bg-blue-100 text-blue-700"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('orderedList') && "bg-blue-100 text-blue-700"
              )}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkDialogOpen(true)}
              className="h-8 w-8 p-0"
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImageDialogOpen(true)}
              className="h-8 w-8 p-0"
              title="Add Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
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

          <div className="flex-1" />

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
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            size="sm"
            className="ml-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent
          editor={editor}
          className="prose prose-lg max-w-none focus:outline-none min-h-[300px]"
        />
      </div>

      {/* Custom styles for YouTube embeds */}
      <style jsx global>{`
        .ProseMirror [data-youtube-video] {
          margin: 1rem 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .ProseMirror iframe[src*="youtube"] {
          width: 100%;
          max-width: 640px;
          height: 360px;
          border: none;
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .ProseMirror iframe[src*="youtube"] {
            height: 250px;
          }
        }
      `}</style>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
            <DialogDescription>
              Enter the URL of the image you want to add to your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImageInsert()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImageInsert} disabled={!imageUrl.trim()}>
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Create a hyperlink in your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLinkInsert()}
            />
            <Input
              placeholder="Link text (optional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLinkInsert()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkInsert} disabled={!linkUrl.trim()}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}