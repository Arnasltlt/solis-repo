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
import { useState, useMemo, useEffect, useRef } from 'react'
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
  onFocus?: () => void
  onBlur?: () => void
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

export function Editor({ 
  onChange, 
  initialData, 
  readOnly = false,
  onFocus,
  onBlur
}: EditorProps) {
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const [editorKey, setEditorKey] = useState(Date.now())
  const editorInteractionsRef = useRef(0)
  const editorInstanceIdRef = useRef(`editor-${Date.now()}`)
  const lastUpdateTimeRef = useRef(Date.now())

  // Log component render
  console.log(`Editor rendering (${editorInstanceIdRef.current})`, {
    readOnly,
    hasInitialData: !!initialData,
    initialDataLength: initialData?.length || 0,
    editorKey
  });

  // Parse initialData safely
  const parsedInitialData = useMemo(() => {
    console.log(`Parsing initial data (${editorInstanceIdRef.current})`, {
      hasData: !!initialData,
      dataPreview: initialData ? initialData.substring(0, 30) + '...' : 'none'
    });
    
    if (!initialData) return null;
    
    try {
      const parsed = JSON.parse(initialData);
      console.log('Successfully parsed initial data', {
        type: parsed.type,
        contentLength: parsed.content?.length || 0
      });
      return parsed;
    } catch (error) {
      console.error('Failed to parse editor initial data:', error);
      return null;
    }
  }, [initialData]);

  // Force editor reinitialization when initialData changes significantly
  useEffect(() => {
    console.log(`Checking if editor needs reset (${editorInstanceIdRef.current})`, {
      initialData: initialData ? initialData.substring(0, 30) + '...' : 'empty'
    });
    
    if (initialData === '' || initialData === '{}') {
      console.log('Resetting editor due to empty initialData');
      setEditorKey(Date.now());
    }
  }, [initialData]);

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
    content: parsedInitialData || {
      type: 'doc',
      content: [
        {
          type: 'paragraph'
        }
      ]
    },
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      editorInteractionsRef.current += 1;
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;
      
      try {
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);
        
        console.log(`Editor update (${editorInstanceIdRef.current}, interaction #${editorInteractionsRef.current})`, {
          timeSinceLastUpdate,
          contentLength: jsonString.length,
          contentPreview: jsonString.substring(0, 50) + '...',
          selection: editor.state.selection.empty ? 'empty' : 'has selection',
          activeMarks: Array.from(editor.state.selection.$head.marks().map(m => m.type.name)).join(', ') || 'none'
        });
        
        onChange(jsonString);
      } catch (error) {
        console.error('Error in editor update handler:', error);
      }
    },
    autofocus: !readOnly,
    onCreate: ({ editor }) => {
      console.log(`Editor created (${editorInstanceIdRef.current})`, {
        isEmpty: editor.isEmpty,
        contentSize: editor.storage.characterCount?.characters() || 'unknown'
      });
    },
    onFocus: ({ editor, event }) => {
      console.log(`Editor focused (${editorInstanceIdRef.current})`);
      onFocus?.();
    },
    onBlur: ({ editor, event }) => {
      console.log(`Editor blurred (${editorInstanceIdRef.current})`);
      onBlur?.();
    },
    onSelectionUpdate: ({ editor }) => {
      console.log(`Selection updated (${editorInstanceIdRef.current})`, {
        selection: editor.state.selection.empty ? 'empty' : 'has selection',
        activeMarks: Array.from(editor.state.selection.$head.marks().map(m => m.type.name)).join(', ') || 'none'
      });
    },
    onTransaction: ({ transaction }) => {
      console.log(`Transaction (${editorInstanceIdRef.current})`, {
        docChanged: transaction.docChanged,
        selectionChanged: !!transaction.selectionSet,
        steps: transaction.steps.length
      });
    }
  })

  // Log when editor is available or not
  useEffect(() => {
    console.log(`Editor instance status (${editorInstanceIdRef.current})`, {
      isAvailable: !!editor,
      isEditable: editor?.isEditable || false
    });
  }, [editor]);

  const addVideo = () => {
    console.log('Add video button clicked');
    setVideoDialogOpen(true)
  }

  const handleVideoSubmit = () => {
    console.log('Video submit handler called', { videoUrl });
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

      console.log('Video embedded successfully', { src });
      setVideoDialogOpen(false)
      setVideoUrl('')
      setVideoError('')
    } catch (error) {
      console.error('Error embedding video:', error);
      setVideoError('Failed to embed video. Please try again.')
    }
  }

  const setLink = () => {
    console.log('Set link button clicked');
    const url = prompt('Enter URL')
    if (url) {
      console.log('Setting link', { url });
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  // Create a wrapper for toolbar button clicks
  const handleToolbarButtonClick = (action: string, callback: () => void) => {
    return (e: React.MouseEvent) => {
      // Prevent event propagation to stop it from bubbling up to form elements
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Toolbar button clicked: ${action}`);
      try {
        // Execute the formatting action
        callback();
        
        // Ensure editor keeps focus after the action
        setTimeout(() => {
          if (editor && !editor.isFocused) {
            console.log(`Restoring focus to editor after ${action}`);
            editor.commands.focus('end');
            
            // Additional focus restoration attempt using DOM
            const editorElement = document.querySelector('.ProseMirror');
            if (editorElement) {
              console.log('Using DOM to focus editor element');
              (editorElement as HTMLElement).focus();
            }
          }
        }, 50);
        
        console.log(`Toolbar action completed: ${action}`);
      } catch (error) {
        console.error(`Error in toolbar action ${action}:`, error);
      }
    };
  };

  if (!editor) {
    return null
  }

  return (
    <div className="relative" key={editorKey}>
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
              onClick={handleToolbarButtonClick('heading-1', () => 
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              )}
              data-active={editor.isActive('heading', { level: 1 })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('heading-2', () => 
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              )}
              data-active={editor.isActive('heading', { level: 2 })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('heading-3', () => 
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              )}
              data-active={editor.isActive('heading', { level: 3 })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('bold', () => 
                editor.chain().focus().toggleBold().run()
              )}
              data-active={editor.isActive('bold')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('italic', () => 
                editor.chain().focus().toggleItalic().run()
              )}
              data-active={editor.isActive('italic')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('link', setLink)}
              data-active={editor.isActive('link')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('blockquote', () => 
                editor.chain().focus().toggleBlockquote().run()
              )}
              data-active={editor.isActive('blockquote')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('bullet-list', () => 
                editor.chain().focus().toggleBulletList().run()
              )}
              data-active={editor.isActive('bulletList')}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('video', addVideo)}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <Video className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('align-left', () => 
                editor.chain().focus().setTextAlign('left').run()
              )}
              data-active={editor.isActive({ textAlign: 'left' })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('align-center', () => 
                editor.chain().focus().setTextAlign('center').run()
              )}
              data-active={editor.isActive({ textAlign: 'center' })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToolbarButtonClick('align-right', () => 
                editor.chain().focus().setTextAlign('right').run()
              )}
              data-active={editor.isActive({ textAlign: 'right' })}
              className="px-2 text-gray-800 hover:bg-gray-100"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <style jsx global>{`
            [data-active="true"] {
              background-color: rgb(243 244 246);
              color: rgb(17 24 39);
            }
            
            /* Ensure editor text is always visible */
            .ProseMirror {
              color: rgb(17 24 39) !important;
            }
            
            .ProseMirror p {
              color: rgb(17 24 39) !important;
            }
            
            .ProseMirror h1, 
            .ProseMirror h2, 
            .ProseMirror h3 {
              color: rgb(17 24 39) !important;
            }
            
            .ProseMirror blockquote {
              color: rgb(75 85 99) !important;
            }
            
            .ProseMirror ul li, 
            .ProseMirror ol li {
              color: rgb(17 24 39) !important;
            }
            
            /* Fix for rendered content on actual pages */
            .prose p, 
            .prose h1, 
            .prose h2, 
            .prose h3, 
            .prose h4, 
            .prose h5, 
            .prose h6, 
            .prose ul li, 
            .prose ol li,
            .prose blockquote {
              color: rgb(17 24 39) !important;
            }
            
            /* Ensure links are visible but still styled as links */
            .prose a, .ProseMirror a {
              color: rgb(37 99 235) !important;
              text-decoration: underline;
            }
            
            /* Fix for any content containers */
            .content-container p,
            .content-container h1,
            .content-container h2,
            .content-container h3,
            .content-container h4,
            .content-container h5,
            .content-container h6,
            .content-container ul li,
            .content-container ol li {
              color: rgb(17 24 39) !important;
            }
          `}</style>
        </>
      )}

      <div className={cn(
        "relative min-h-[500px] w-full max-w-screen-lg mx-auto",
        "prose dark:prose-invert prose-headings:font-heading prose-headings:leading-tight",
        "focus:outline-none text-gray-900",
        readOnly ? "prose-lg" : "prose-md",
        "px-8 py-6"
      )}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
} 