'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/index'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Minimize2, Maximize2 } from 'lucide-react'

// Dynamically import Editor with no SSR
const Editor = dynamic(() => import('../editor/editor-wrapper').then(mod => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] rounded-md border flex items-center justify-center">
      Loading editor...
    </div>
  )
})

interface RichContentFormProps {
  contentBody: string
  onChange: (field: string, value: any) => void
  readOnly?: boolean
}

export function RichContentForm({ 
  contentBody,
  onChange,
  readOnly = false
}: RichContentFormProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [key, setKey] = useState(Date.now())
  const [editorMounted, setEditorMounted] = useState(false)

  // Reset key when content is cleared
  useEffect(() => {
    if (contentBody === '') {
      setKey(Date.now())
    }
  }, [contentBody])

  // Ensure editor is mounted
  useEffect(() => {
    setEditorMounted(true)
    return () => setEditorMounted(false)
  }, [])

  const handleEditorChange = useCallback((data: string) => {
    onChange('contentBody', data)
  }, [onChange])

  return (
    <div className={cn("relative", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      <div className="mb-4 space-y-4">
        <div className="space-y-2">
          {!readOnly && (
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
          )}
          {editorMounted && (
            <Editor
              key={key}
              initialData={contentBody || ''}
              onChange={handleEditorChange}
              readOnly={readOnly}
            />
          )}
        </div>
      </div>
    </div>
  )
} 