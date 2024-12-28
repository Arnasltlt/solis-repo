'use client'

import { useRef, useState, useEffect, ChangeEvent } from 'react'
import EditorJS from '@editorjs/editorjs'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Minimize2, Maximize2 } from 'lucide-react'
import { FileUpload } from '@/components/ui/file-upload'

// Type declarations for EditorJS plugins
declare module '@editorjs/embed' {
  const Embed: any
  export default Embed
}

declare module '@editorjs/marker' {
  const Marker: any
  export default Marker
}

declare module '@editorjs/checklist' {
  const Checklist: any
  export default Checklist
}

// Import tools
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Image from '@editorjs/image'
import Embed from '@editorjs/embed'
import Table from '@editorjs/table'
import Quote from '@editorjs/quote'
import Marker from '@editorjs/marker'
import InlineCode from '@editorjs/inline-code'
import Delimiter from '@editorjs/delimiter'
import CheckList from '@editorjs/checklist'

const EDITOR_TOOLS = {
  paragraph: {
    inlineToolbar: true
  },
  header: {
    class: Header,
    inlineToolbar: true,
    config: {
      levels: [1, 2, 3, 4],
      defaultLevel: 2,
      defaultAlignment: 'left'
    }
  },
  list: {
    class: List,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered'
    }
  },
  checklist: {
    class: CheckList,
    inlineToolbar: true
  },
  marker: {
    class: Marker,
    shortcut: 'CMD+SHIFT+M'
  },
  inlineCode: {
    class: InlineCode,
    shortcut: 'CMD+SHIFT+C'
  },
  delimiter: Delimiter,
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByFile(file: File) {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              resolve({
                success: 1,
                file: {
                  url: e.target?.result
                }
              })
            }
            reader.readAsDataURL(file)
          })
        }
      },
      captionPlaceholder: 'Caption'
    }
  },
  embed: {
    class: Embed,
    inlineToolbar: true,
    config: {
      services: {
        youtube: true,
        vimeo: true
      }
    }
  },
  table: {
    class: Table,
    inlineToolbar: true,
    config: {
      rows: 2,
      cols: 3,
    },
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: 'Enter a quote',
      captionPlaceholder: 'Quote\'s author'
    }
  }
}

interface RichContentFormProps {
  contentBody: string
  onChange: (field: string, value: any) => void
}

export function RichContentForm({ 
  contentBody,
  onChange 
}: RichContentFormProps) {
  const editorRef = useRef<EditorJS>()
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: 'editorjs',
        tools: EDITOR_TOOLS,
        placeholder: 'Start writing or press "/" to see available tools...',
        onChange: async () => {
          const data = await editorRef.current?.save()
          onChange('contentBody', JSON.stringify(data))
        },
        data: contentBody ? JSON.parse(contentBody) : undefined,
        inlineToolbar: ['bold', 'italic', 'marker', 'inlineCode', 'link'],
        defaultBlock: 'paragraph'
      })

      editorRef.current = editor
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy()
      }
    }
  }, [])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Force Editor.js to recalculate its dimensions
    setTimeout(() => {
      if (editorRef.current) {
        // @ts-ignore - refresh is not in types but exists in Editor.js
        editorRef.current.refresh()
      }
    }, 100)
  }

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        toggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isFullscreen])

  return (
    <div className={cn("relative", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      <div className="mb-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Content Body</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div id="editorjs" className="min-h-[200px] rounded-md border" />
        </div>
      </div>
    </div>
  )
} 