'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Save, Loader2, CheckCircle, AlertCircle, 
  Bold, Italic, Link, List,
  Type, Eye
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  if (!url?.trim()) return null
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v')
    }
    
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1)
    }
    
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/embed/')[1]
    }
    
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1]
    }
    
    return null
  } catch (error) {
    return null
  }
}

// Clean content from any JSON artifacts and extract text from ProseMirror JSON
const cleanJSONArtifacts = (content: string): string => {
  let cleaned = content || ''
  
  // If this looks like ProseMirror JSON, try to extract text content
  if (cleaned.includes('"type":') && cleaned.includes('"content":')) {
    try {
      // Try to parse as JSON and extract text
      const parsedContent = JSON.parse(cleaned)
      if (parsedContent && parsedContent.content) {
        cleaned = extractTextFromProseMirror(parsedContent)
      }
    } catch (e) {
      // If JSON parsing fails, fall back to regex cleaning
      console.warn('Failed to parse ProseMirror JSON, using regex cleaning')
    }
  }
  
  // Remove common ProseMirror JSON patterns that might be leftover
  cleaned = cleaned.replace(/\{"type":"[^"]*"[^}]*\}/g, '')
  cleaned = cleaned.replace(/\{"content":\[[^\]]*\]/g, '')
  cleaned = cleaned.replace(/\{"attrs":\{[^}]*\}\}/g, '')
  cleaned = cleaned.replace(/"type":\s*"[^"]*"/g, '')
  cleaned = cleaned.replace(/"content":\s*"[^"]*"/g, '')
  cleaned = cleaned.replace(/"text":\s*"[^"]*"/g, '')
  
  // Remove standalone JSON fragments
  cleaned = cleaned.replace(/["}]+,?\s*["}]+/g, '')
  cleaned = cleaned.replace(/^\s*[",:\[\]{}]+/g, '')
  cleaned = cleaned.replace(/[",:\[\]{}]+\s*$/g, '')
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

// Extract text content from ProseMirror JSON while preserving structure
const extractTextFromProseMirror = (doc: any): string => {
  if (!doc || !doc.content) return ''
  
  const extractFromNode = (node: any): string => {
    if (node.text) {
      // Apply marks (bold, italic, etc.)
      let text = node.text
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `**${text}**`
          if (mark.type === 'italic') text = `*${text}*`
        }
      }
      return text
    }
    
    if (node.content && Array.isArray(node.content)) {
      const content = node.content.map(extractFromNode).join('')
      
      // Handle different node types with proper formatting
      switch (node.type) {
        case 'heading':
          const level = node.attrs?.level || 1
          const prefix = '#'.repeat(level)
          return `\n${prefix} ${content}\n\n`
        case 'paragraph':
          return content ? `${content}\n\n` : '\n'
        case 'listItem':
          return `${content.trim()}\n`
        case 'orderedList':
          // For ordered lists, we need to number the items
          const numberedItems = content.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => 
            `${i + 1}. ${line.trim()}`
          ).join('\n')
          return `${numberedItems}\n\n`
        case 'bulletList':
          // For bullet lists, add bullet points
          const bulletItems = content.split('\n').filter((line: string) => line.trim()).map((line: string) => 
            `- ${line.trim()}`
          ).join('\n')
          return `${bulletItems}\n\n`
        default:
          return content
      }
    }
    
    // Handle special node types
    if (node.type === 'youtube' && node.attrs && node.attrs.src) {
      return `${node.attrs.src}\n\n`
    }
    
    if (node.type === 'hardBreak') {
      return '\n'
    }
    
    return ''
  }
  
  if (Array.isArray(doc.content)) {
    return doc.content.map(extractFromNode).join('').trim()
  }
  
  return ''
}

// Convert YouTube URLs in text to iframe embeds
const convertYouTubeUrls = (content: string): string => {
  // Clean content first
  let cleanContent = cleanJSONArtifacts(content)
  
  // More comprehensive YouTube URL regex that captures the entire URL with parameters
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)/g
  
  return cleanContent.replace(youtubeRegex, (match, videoId, offset, string) => {
    // Only replace if we have a valid 11-character video ID
    if (videoId && videoId.length === 11) {
      return `<div style="margin: 1rem 0; text-align: center; position: relative;">
        <iframe 
          width="640" 
          height="360" 
          src="https://www.youtube.com/embed/${videoId}" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen
          style="max-width: 100%; border-radius: 8px; pointer-events: none;"
        ></iframe>
        <div style="position: absolute; inset: 0; pointer-events: none;"></div>
      </div>`
    }
    return match // Return original if something's wrong
  })
}

// Display component for rendered content
const ContentDisplay = ({ content }: { content: string }) => {
  console.log('[DEBUG] ContentDisplay received:', {
    originalContent: content,
    length: content?.length,
    firstChars: content?.substring(0, 100)
  })
  
  // For content that's already processed from ProseMirror (like in read-only mode),
  // we don't need aggressive JSON cleaning that removes structure
  let cleanContent = content || ''
  
  // Only do minimal cleaning if it looks like it might have JSON artifacts
  if (cleanContent.includes('{"type"') || cleanContent.includes('"content"')) {
    cleanContent = cleanJSONArtifacts(cleanContent)
  }
  
  console.log('[DEBUG] After JSON cleanup:', {
    cleanContent,
    length: cleanContent?.length,
    firstChars: cleanContent?.substring(0, 100)
  })
  
  // First, normalize line breaks and ensure proper spacing
  let processedContent = cleanContent
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')   // Handle Mac line endings
  
  // Split into lines and process each line individually
  // Also split on heading patterns to handle concatenated headings
  let lines = processedContent.split('\n')
  
  // Split lines that have multiple headings concatenated
  const expandedLines = []
  for (let line of lines) {
    line = line.trim()
    if (!line) {
      expandedLines.push('')
      continue
    }
    
    // Split on heading patterns: ## text # text becomes separate lines
    // Look for multiple heading patterns in one line
    const headingMatches = line.match(/(#+\s+[^#]*?)(?=\s*#+\s|$)/g)
    if (headingMatches && headingMatches.length > 1) {
      // Multiple headings found, add each separately
      expandedLines.push(...headingMatches.map(h => h.trim()))
    } else {
      expandedLines.push(line)
    }
  }
  
  const processedLines = expandedLines.map((line, index) => {
    line = line.trim()
    if (!line) return '' // Skip empty lines instead of adding breaks
    
    // Check for headings first (most specific)
    if (line.match(/^### /)) {
      return `<h3 class="text-lg font-semibold mb-2 mt-4">${line.replace(/^### /, '')}</h3>`
    }
    if (line.match(/^## /)) {
      return `<h2 class="text-xl font-bold mb-3 mt-6">${line.replace(/^## /, '')}</h2>`
    }
    if (line.match(/^# /)) {
      return `<h1 class="text-2xl font-bold mb-4 mt-8">${line.replace(/^# /, '')}</h1>`
    }
    
    // Check for ordered list items
    if (line.match(/^\d+\. /)) {
      return `<li class="ml-4 mb-1">${line.replace(/^\d+\. /, '')}</li>`
    }
    
    // Check for bullet list items
    if (line.match(/^[\-\*] /)) {
      return `<li class="ml-4 mb-1">${line.replace(/^[\-\*] /, '')}</li>`
    }
    
    // Apply inline formatting to regular text
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
    
    // Regular paragraph
    return `<p class="mb-3">${line}</p>`
  })
  
  // Join processed lines, filtering out empty strings but preserve structure
  processedContent = processedLines.filter(line => line.trim() !== '').join('\n')
  
  // Add separators between different list types to prevent them from merging
  processedContent = processedContent.replace(/(<\/li>\n)(<li class="ml-4 mb-1">)/g, (match, closing, opening, offset, string) => {
    // Check if we're transitioning between different list types
    const beforeContext = string.substring(Math.max(0, offset - 200), offset)
    const afterContext = string.substring(offset, offset + 200)
    
    // If we find both bullet and numbered patterns nearby, add a separator
    const hasBullets = /-\s/.test(cleanContent)
    const hasNumbers = /\d+\.\s/.test(cleanContent)
    
    if (hasBullets && hasNumbers) {
      return closing + '\n<!-- LIST_BREAK -->\n' + opening
    }
    return match
  })
  
  // Group consecutive list items and detect their type (split by our separators)
  let listCounter = 0
  processedContent = processedContent.replace(/((?:<li class="ml-4 mb-1">.*?<\/li>\n?)+)(?=\n?<!--\s*LIST_BREAK\s*-->|\n?<|\n?$)/g, (match) => {
    // Simple approach: track which list this is and check the original content pattern
    const lines = cleanContent.split('\n')
    
    // Find lines that match our list patterns
    const bulletLines = lines.filter(line => line.match(/^[\-\*]\s/))
    const numberedLines = lines.filter(line => line.match(/^\d+\.\s/))
    
    // Extract the actual content from the HTML match to compare
    const listItems = match.match(/<li class="ml-4 mb-1">(.*?)<\/li>/g) || []
    const firstItemContent = listItems[0]?.replace(/<[^>]*>/g, '').trim()
    
    // Check if this first item appears in numbered or bullet format in original
    const isInNumberedList = firstItemContent ? numberedLines.some(line => line.includes(firstItemContent)) : false
    const isInBulletList = firstItemContent ? bulletLines.some(line => line.includes(firstItemContent)) : false
    
    // If it appears in both (unlikely), prefer ordered for numbers, bullets for bullets
    const isOrdered = isInNumberedList && !isInBulletList
    
    const listClass = isOrdered ? 'list-decimal' : 'list-disc'
    listCounter++
    
    console.log(`[DEBUG] List ${listCounter}:`, {
      firstItemContent,
      isInNumberedList,
      isInBulletList,
      isOrdered,
      listClass
    })
    
    return `<ul class="${listClass} ml-6 mb-4">\n${match}</ul>\n`
  })
  
  // Clean up separators and extra spacing
  processedContent = processedContent.replace(/<!--\s*LIST_BREAK\s*-->\n?/g, '')
  processedContent = processedContent.replace(/<br>\n?<br>/g, '<br>')
  processedContent = processedContent.replace(/\n+/g, '\n')
  processedContent = processedContent.trim()
  
  // Apply YouTube URL conversion (which also does additional cleaning)
  processedContent = convertYouTubeUrls(processedContent)
  
  console.log('[DEBUG] Final processed content:', {
    processedContent,
    length: processedContent?.length,
    firstChars: processedContent?.substring(0, 200)
  })
  
  return (
    <div 
      className="prose max-w-none p-4 min-h-[200px]"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

interface UltraSimpleEditorProps {
  initialContent?: string
  onChange: (content: string) => void
  onSave?: () => Promise<void>
  readOnly?: boolean
  className?: string
}

export function UltraSimpleEditor({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  className
}: UltraSimpleEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isPreviewMode, setIsPreviewMode] = useState(readOnly)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Update content when initialContent changes (for read-only mode)
  useEffect(() => {
    if (readOnly && initialContent) {
      // For read-only mode, process ProseMirror JSON to readable text
      try {
        const parsed = JSON.parse(initialContent)
        const processedText = extractTextFromProseMirror(parsed)
        setContent(processedText)
      } catch (e) {
        // If not JSON, use as-is
        setContent(initialContent)
      }
    } else {
      setContent(initialContent)
    }
  }, [initialContent, readOnly])

  const handleContentChange = useCallback((value: string) => {
    setContent(value)
    onChange(value)
    setHasUnsavedChanges(true)

    // Auto-save disabled for now
    // if (saveTimeoutRef.current) {
    //   clearTimeout(saveTimeoutRef.current)
    // }

    // saveTimeoutRef.current = setTimeout(async () => {
    //   if (onSave) {
    //     try {
    //       setIsSaving(true)
    //       await onSave()
    //       setLastSaved(new Date())
    //       setHasUnsavedChanges(false)
    //       toast({
    //         title: 'Auto-saved',
    //         description: 'Your content has been saved automatically'
    //       })
    //     } catch (error) {
    //       toast({
    //         title: 'Save failed',
    //         description: 'Could not save content automatically',
    //         variant: 'destructive'
    //       })
    //     } finally {
    //       setIsSaving(false)
    //     }
    //   }
    // }, 2000)
  }, [onChange, onSave])

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

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder
    
    const newText = content.substring(0, start) + before + textToInsert + after + content.substring(end)
    
    setContent(newText)
    handleContentChange(newText)
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setIsPreviewMode(!isPreviewMode)
      }
    }

    if (!readOnly) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave, readOnly, isPreviewMode])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (readOnly) {
    console.log('[DEBUG] Read-only mode - content received:', {
      content,
      initialContent,
      length: content?.length,
      firstChars: content?.substring(0, 100)
    })
    return (
      <div className={cn("border rounded-lg bg-white", className)}>
        <ContentDisplay content={content} />
      </div>
    )
  }

  return (
    <div className={cn("border rounded-lg bg-white", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-1">
          {/* Formatting buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertText('**', '**', 'bold text')}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertText('*', '*', 'italic text')}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertText('# ', '', 'Heading')}
            className="h-8 px-2 text-sm"
            title="Heading"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertText('- ', '', 'List item')}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertText('[', '](url)', 'link text')}
            className="h-8 w-8 p-0"
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300 mx-2" />
          
          <Button
            variant={isPreviewMode ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsPreviewMode(!isPreviewMode)
            }}
            type="button"
            className="h-8 w-8 p-0"
            title="Toggle Preview (Ctrl+P)"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>

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

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor/Preview Content */}
      <div className="p-4">
        {isPreviewMode ? (
          <ContentDisplay content={content} />
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your content here... 

You can:
• Use **bold** and *italic* formatting
• Add # headings
• Insert YouTube URLs directly - they'll become embedded videos in preview mode
• Use markdown-style formatting"
            className="min-h-[300px] resize-none border-none focus:ring-0 text-base leading-relaxed"
          />
        )}
      </div>


      {/* Info banner */}
      {!isPreviewMode && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500">
            💡 Tip: Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+P</kbd> to toggle preview mode and see how YouTube videos will appear to your customers.
          </p>
        </div>
      )}
    </div>
  )
}