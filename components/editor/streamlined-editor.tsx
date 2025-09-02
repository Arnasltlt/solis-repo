'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react'
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Video
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Node, mergeAttributes } from '@tiptap/core'
import Youtube from '@tiptap/extension-youtube'

// Simple video URL validation
const validateVideoUrl = (url: string): string | null => {
  if (!url.trim()) {
    return 'Please enter a video URL';
  }

  // Check if it's a valid URL format
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return 'Please enter a valid URL format';
  }

  // Basic validation - accept any URL that looks like it could be a video
  return null; // URL is valid
};

// Simple video embed URL generator
const getVideoEmbedUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

    // YouTube detection and embed URL generation
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = null;

      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes('/watch')) {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.includes('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1];
      } else if (urlObj.pathname.includes('/shorts/')) {
        videoId = urlObj.pathname.split('/shorts/')[1];
      }

      if (videoId && videoId.length === 11) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Vimeo detection
    if (urlObj.hostname.includes('vimeo.com')) {
      const match = urlObj.pathname.match(/\/(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }

    // For other video URLs (direct video files), return as-is
    // The iframe will handle it, or we can use a video element
    return url;
  } catch (error) {
    console.error('Error generating video embed URL:', error);
    return null;
  }
};

// Custom Video node
const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'iframe[src]',
        getAttrs: (dom) => ({
          src: dom.getAttribute('src'),
        }),
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      { class: 'video-embed', style: 'margin: 1rem 0; max-width: 100%;' },
      ['iframe', 
        mergeAttributes(HTMLAttributes, {
          style: 'width: 100%; height: 400px; border-radius: 8px; border: none;',
          allowfullscreen: true,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          loading: 'lazy',
        })
      ]
    ]
  },

  addCommands() {
    return {
      setVideo:
        (attrs: { src: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({ type: this.name, attrs })
        }
    } as any
  },

  addNodeView() {
    return ({ node }) => {
      const div = document.createElement('div')
      div.className = 'video-embed'
      div.style.cssText = 'margin: 1rem 0; max-width: 100%;'
      
      const iframe = document.createElement('iframe')
      iframe.src = node.attrs.src
      iframe.style.cssText = 'width: 100%; height: 400px; border-radius: 8px; border: none;'
      iframe.setAttribute('allowfullscreen', '')
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')
      iframe.setAttribute('loading', 'lazy')
      
      div.appendChild(iframe)
      return { dom: div }
    }
  },
})

interface StreamlinedEditorProps {
  initialContent?: string
  onChange: (content: string) => void
  onSave?: () => Promise<void>
  readOnly?: boolean
  className?: string
}

export function StreamlinedEditor({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  className
}: StreamlinedEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastContentRef = useRef('')

  const editor = useEditor({
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
        modestBranding: true,
        width: 640,
        height: 400,
        allowFullscreen: true
      })
    ],
    content: (() => {
      if (!initialContent) return '';
      try {
        // Try to parse as JSON (existing content)
        const parsed = JSON.parse(initialContent);
        return parsed;
      } catch (e) {
        // If not JSON, assume it's HTML and return as string
        return initialContent;
      }
    })(),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Get content as JSON (ProseMirror format) for compatibility
      const json = editor.getJSON()
      const jsonString = JSON.stringify(json)
      onChange(jsonString)

      // Mark as having unsaved changes
      if (jsonString !== lastContentRef.current) {
        setHasUnsavedChanges(true)
        lastContentRef.current = jsonString

        // Auto-save after 3 seconds of inactivity
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
        }, 3000)
      }
    }
  })

  // Manual save function
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

  // Handle image insertion
  const handleImageInsert = useCallback(() => {
    if (!imageUrl.trim()) return

    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setImageDialogOpen(false)
    toast({ title: 'Image added', description: 'Image has been inserted into your content' })
  }, [editor, imageUrl])

  // Handle link insertion
  const handleLinkInsert = useCallback(() => {
    if (!linkUrl.trim()) return

    const text = linkText.trim() || linkUrl
    editor?.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`).run()
    setLinkUrl('')
    setLinkText('')
    setLinkDialogOpen(false)
    toast({ title: 'Link added', description: 'Link has been inserted into your content' })
  }, [editor, linkUrl, linkText])

  // Handle video insertion
  const handleVideoInsert = useCallback(() => {
    if (!videoUrl.trim()) return

    const validationError = validateVideoUrl(videoUrl)
    if (validationError) {
      toast({
        title: 'Invalid video URL',
        description: validationError,
        variant: 'destructive'
      })
      return
    }

    // Use official YouTube extension command with src (runtime expects src)
    editor?.chain().focus().setYoutubeVideo({ src: videoUrl, width: 640, height: 400 } as any).run()

    // Add empty paragraph after
    editor?.chain().insertContent({ type: 'paragraph' }).run()

    setVideoDialogOpen(false)
    setVideoUrl('')

    toast({
      title: 'Video added',
      description: 'Video has been embedded in your content'
    })
  }, [editor, videoUrl, toast])

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
        <div className="sticky top-16 z-50 flex items-center gap-1 p-3 border-b bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              data-active={editor.isActive('bold')}
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
              data-active={editor.isActive('italic')}
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
              data-active={editor.isActive('heading', { level: 1 })}
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
              data-active={editor.isActive('heading', { level: 2 })}
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
              data-active={editor.isActive('bulletList')}
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
              data-active={editor.isActive('orderedList')}
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
              onClick={() => setVideoDialogOpen(true)}
              className="h-8 w-8 p-0"
              title="Add YouTube Video"
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Status and Save Button */}
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

      {/* Video Embed Styles */}
      <style jsx global>{`
        .video-embed {
          margin: 1rem 0;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .video-embed iframe {
          width: 100%;
          height: 400px;
          border: none;
          border-radius: 8px;
        }

        /* Responsive video sizing */
        @media (max-width: 768px) {
          .video-embed iframe {
            height: 250px;
          }
        }

        /* Editor-specific video styles */
        .ProseMirror .video-embed {
          margin: 1rem 0;
        }

        /* Improve editor readability for video markers */
        .ProseMirror p {
          line-height: 1.6;
          margin: 0.5rem 0;
        }

        /* Make the editor content more readable */
        .ProseMirror {
          font-family: inherit;
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

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video</DialogTitle>
            <DialogDescription>
              Paste any video URL to embed it in your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Paste video URL here (YouTube, Vimeo, etc.)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVideoInsert()}
              autoFocus
            />
            <div className="text-sm text-gray-500">
              Supports YouTube, Vimeo, and other video platforms
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setVideoDialogOpen(false)
              setVideoUrl('')
            }}>
              Cancel
            </Button>
            <Button onClick={handleVideoInsert} disabled={!videoUrl.trim()}>
              Add Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1) || null
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1]
    }
    // As a last resort, try regex
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|embed\/([a-zA-Z0-9_-]{11})/)
    const id = match?.[1] || match?.[2] || match?.[3]
    return id || null
  } catch {
    return null
  }
}
