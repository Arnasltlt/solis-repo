'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/index'
import { Button } from '@/components/ui/button'
import { Minimize2, Maximize2 } from 'lucide-react'

// Dynamically import the ultra-simple editor with no SSR
const Editor = dynamic(() => import('../editor/ultra-simple-editor').then(mod => mod.UltraSimpleEditor), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] rounded-md border flex items-center justify-center">
      Loading editor...
    </div>
  )
})

interface RichContentFormProps {
  contentBody: string | null
  onChange: (field: string, value: string) => void
  onSave?: () => Promise<void>
  readOnly?: boolean
}

export function RichContentForm({ 
  contentBody,
  onChange,
  onSave,
  readOnly = false
}: RichContentFormProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [key, setKey] = useState<number>(Date.now())
  const [editorMounted, setEditorMounted] = useState(false)
  const [processedContent, setProcessedContent] = useState<string>('')

  // Ensure editor is mounted
  useEffect(() => {
    setEditorMounted(true)
    return () => setEditorMounted(false)
  }, [])

  const adaptedOnChange = useCallback((data: string) => {
    // Make sure data is not null or undefined
    if (data) {
      // Always save as ProseMirror JSON
      onChange('contentBody', data);
    } else {
      console.warn('Editor onChange called with empty data');
    }
  }, [onChange])

  return (
    <div className={cn("relative", isFullscreen && "fixed inset-0 z-50 bg-background")}>
      <div className="mb-4 space-y-4">
        <div className="space-y-2">
          {!readOnly && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  type="button" // Prevent form submission
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <div className="rounded-md border">
            <Editor
              key={key}
              initialContent={contentBody || ''}
              onChange={(value) => onChange('contentBody', value)}
              onSave={onSave}
              readOnly={readOnly}
              // Remove fullscreen and setFullscreen if not supported, or add if needed
            />
          </div>
        </div>
      </div>
    </div>
  )
} 