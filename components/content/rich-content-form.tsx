'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/index'
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
  contentBody: string | null
  onChange: (field: string, value: string) => void
  readOnly?: boolean
}

export function RichContentForm({ 
  contentBody,
  onChange,
  readOnly = false
}: RichContentFormProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [key, setKey] = useState<number>(Date.now())
  const [editorMounted, setEditorMounted] = useState(false)
  const [processedContent, setProcessedContent] = useState<string>('')

  // Process content to ensure iframes are properly handled
  useEffect(() => {
    // Process the contentBody to ensure proper handling of iframes
    if (!contentBody || contentBody === 'contentBody') {
      setProcessedContent('')
      return
    }
    
    // Check if we're in a new content form (no initialData) and clear any existing content
    if (typeof window !== 'undefined' && window.location.href.includes('/manage/content?tab=create') && !window.location.href.includes('edit=')) {
      setProcessedContent('')
      return
    }
    
    try {
      // Try to parse as JSON to validate
      JSON.parse(contentBody)
      // If it parses, assume it's valid ProseMirror JSON
      setProcessedContent(contentBody)
    } catch (e) {
      // If not valid JSON, check if it contains HTML (basic check)
      if (typeof contentBody === 'string' && (contentBody.includes('<iframe') || contentBody.includes('<p>'))) {
        setProcessedContent(contentBody)
      } else {
        // Otherwise, treat as plain text (or handle as error)
        setProcessedContent(contentBody)
      }
    }
    
    // Reset the key to force re-render when contentBody changes
    setKey(Date.now())
  }, [contentBody])

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
              initialData={processedContent}
              onChange={adaptedOnChange}
              readOnly={readOnly}
              fullscreen={isFullscreen}
              setFullscreen={setIsFullscreen}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 