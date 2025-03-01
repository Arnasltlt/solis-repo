'use client'

import { useState, useEffect } from 'react'
import { RichContentForm } from './rich-content-form'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ContentBodyDisplayProps {
  contentBody: string | null
  isPremium?: boolean
}

export function ContentBodyDisplay({ contentBody, isPremium = false }: ContentBodyDisplayProps) {
  const [parsedContent, setParsedContent] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    if (contentBody) {
      try {
        const parsed = JSON.parse(contentBody)
        setParsedContent(parsed)
        setParseError(null)
      } catch (error) {
        console.error('Failed to parse content body:', error instanceof Error ? error.message : String(error))
        setParseError(error instanceof Error ? error.message : 'Invalid JSON format')
        setParsedContent(null)
      }
    } else {
      setParsedContent(null)
      setParseError(null)
    }
  }, [contentBody])

  if (isPremium) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500">
          This content is only available for premium users.
        </p>
      </div>
    )
  }

  if (parseError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error displaying content</AlertTitle>
        <AlertDescription>
          There was an error parsing the content: {parseError}
        </AlertDescription>
      </Alert>
    )
  }

  if (!contentBody) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <p className="text-center text-gray-500">
          No content available.
        </p>
      </div>
    )
  }

  return (
    <div className="prose max-w-none">
      <RichContentForm
        contentBody={contentBody}
        onChange={() => {}}
        readOnly
      />
    </div>
  )
} 