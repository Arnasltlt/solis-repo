'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { Iframe } from '@/lib/extensions/iframe'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import {
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Video,
  Bold,
  Italic,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils/index'

interface EditorProps {
  onChange: (data: any) => void
  initialData?: string
  readOnly?: boolean
}

// Function to extract video ID from various video URLs
function extractVideoId(videoUrl: string): string | null {
  // Process YouTube URLs
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (watchMatch && watchMatch[1]) {
      return watchMatch[1];
    }
    return null;
  }
  
  // Process Vimeo URLs
  if (videoUrl.includes('vimeo.com')) {
    // Handle vimeo.com/VIDEO_ID
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return vimeoMatch[1];
    }
    return null;
  }
  
  return null;
}

// Function to get embed HTML for a video URL
function getVideoEmbedHtml(videoUrl: string): string | null {
  const videoId = extractVideoId(videoUrl);
  
  if (!videoId) return null;
  
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  
  if (videoUrl.includes('vimeo.com')) {
    return `<iframe src="https://player.vimeo.com/video/${videoId}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  
  return null;
}

export function Editor({ onChange, initialData, readOnly = false }: EditorProps) {
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Iframe.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg my-4',
          frameborder: '0',
          allowfullscreen: true,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline decoration-primary cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialData ? JSON.parse(initialData) : {
      type: 'doc',
      content: [
        {
          type: 'paragraph'
        }
      ]
    },
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
  })

  const addVideo = () => {
    setVideoDialogOpen(true)
  }

  const handleVideoSubmit = () => {
    if (!videoUrl || !editor) {
      setVideoError('Please enter an embed code')
      return
    }

    try {
      // Create a temporary div to parse the iframe HTML
      const div = document.createElement('div')
      div.innerHTML = videoUrl.trim()
      const iframe = div.querySelector('iframe')

      if (!iframe) {
        setVideoError('Please enter a valid embed code')
        return
      }

      // Get the src from the iframe
      const src = iframe.getAttribute('src')
      if (!src) {
        setVideoError('No video source found in embed code')
        return
      }

      // Insert the iframe
      editor.chain()
        .focus()
        .insertContent({
          type: 'iframe',
          attrs: { src }
        })
        .enter()
        .run()

      setVideoDialogOpen(false)
      setVideoUrl('')
      setVideoError('')
    } catch (error) {
      setVideoError('Failed to embed video. Please try again.')
    }
  }

  const setLink = () => {
    const url = prompt('Enter URL')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="relative">
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
            <DialogDescription>
              Paste the embed code from YouTube or Vimeo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
              placeholder="<iframe src='https://...' ...></iframe>"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value)
                setVideoError('')
              }}
            />
            {videoError && (
              <p className="text-sm text-red-500">{videoError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVideoDialogOpen(false)
                setVideoUrl('')
                setVideoError('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleVideoSubmit}>
              Embed Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!readOnly && (
        <>
          <div className="sticky top-0 z-50 flex items-center gap-2 border-b bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              data-active={editor?.isActive('heading', { level: 1 })}
              className="px-2"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              data-active={editor?.isActive('heading', { level: 2 })}
              className="px-2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              data-active={editor?.isActive('heading', { level: 3 })}
              className="px-2"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              data-active={editor?.isActive('bold')}
              className="px-2"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              data-active={editor?.isActive('italic')}
              className="px-2"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={setLink}
              data-active={editor?.isActive('link')}
              className="px-2"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              data-active={editor?.isActive('blockquote')}
              className="px-2"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              data-active={editor?.isActive('bulletList')}
              className="px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addVideo}
              className="px-2"
            >
              <Video className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              data-active={editor?.isActive({ textAlign: 'left' })}
              className="px-2"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              data-active={editor?.isActive({ textAlign: 'center' })}
              className="px-2"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              data-active={editor?.isActive({ textAlign: 'right' })}
              className="px-2"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <style jsx global>{`
            [data-active="true"] {
              background-color: rgb(243 244 246);
              color: rgb(17 24 39);
            }
          `}</style>
        </>
      )}

      <div className={cn(
        "relative min-h-[500px] w-full max-w-screen-lg mx-auto",
        "prose dark:prose-invert prose-headings:font-heading prose-headings:leading-tight",
        "focus:outline-none",
        readOnly ? "prose-lg" : "prose-md",
        "px-8 py-6"
      )}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
} 