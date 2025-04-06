'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/index'
import { Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// Dynamically import Editor with no SSR
const Editor = dynamic(() => import('../editor/editor-wrapper').then(mod => mod.Editor), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] rounded-md border flex items-center justify-center">
      Loading editor...
    </div>
  )
})

interface EnhancedEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  label?: string
}

/**
 * Enhanced Editor component that properly handles content body
 * and ensures reliable content updates
 */
export function EnhancedEditor({
  value,
  onChange,
  readOnly = false,
  label = "Content Body"
}: EnhancedEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorKey, setEditorKey] = useState(Date.now())
  
  // Reset editor when content is cleared
  useEffect(() => {
    if (!value || value === '') {
      setEditorKey(Date.now())
    }
  }, [value])
  
  // Handle editor changes and ensure proper data formatting
  const handleEditorChange = useCallback((data: string) => {
    if (!data) {
      onChange('')
      return
    }
    
    // Skip the literal string 'contentBody'
    if (data === 'contentBody') {
      return
    }
    
    try {
      // If it's already valid JSON, ensure it stays as a string
      JSON.parse(data);
      // It's JSON, pass it directly
      onChange(data);
    } catch (e) {
      // It's not JSON, so just pass the string as is
      onChange(data);
    }
  }, [onChange])
  
  // Sanitize initial value
  const sanitizedValue = value === 'contentBody' || !value ? '' : value
  
  return (
    <div className={cn("relative", isFullscreen && "fixed inset-0 z-50 bg-background p-4")}>
      <div className="mb-4 space-y-4">
        <div className="space-y-2">
          {!readOnly && (
            <div className="flex items-center justify-between">
              <Label>{label}</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                type="button"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
          
          <div className="border rounded-md">
            <Editor
              key={editorKey}
              initialData={sanitizedValue}
              onChange={handleEditorChange}
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