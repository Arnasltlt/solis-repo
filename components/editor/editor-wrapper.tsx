'use client'

import { useEffect, useRef } from 'react'
import EditorJS from '@editorjs/editorjs'
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

interface EditorProps {
  onChange: (data: any) => void
  initialData?: string
  holder: string
  readOnly?: boolean
}

export function Editor({ onChange, initialData, holder, readOnly = false }: EditorProps) {
  const editorRef = useRef<EditorJS>()

  useEffect(() => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: EDITOR_TOOLS,
        placeholder: 'Start writing or press "/" to see available tools...',
        onChange: async () => {
          const data = await editorRef.current?.save()
          onChange(data)
        },
        data: initialData ? JSON.parse(initialData) : undefined,
        inlineToolbar: readOnly ? false : ['bold', 'italic', 'marker', 'inlineCode', 'link'],
        defaultBlock: 'paragraph',
        readOnly: readOnly
      })

      editorRef.current = editor
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy()
      }
    }
  }, [])

  return (
    <div 
      id={holder} 
      className={`min-h-[200px] rounded-md border ${readOnly ? 'prose max-w-none' : ''}`}
    />
  )
} 