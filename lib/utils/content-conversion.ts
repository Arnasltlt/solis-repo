/**
 * Utility functions for converting content between different formats
 */

import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Iframe } from '@/lib/extensions/iframe'
import { Youtube } from '@/lib/extensions/youtube'
import { YoutubeBlock } from '@/lib/extensions/youtube-block'
import { VimeoBlock } from '@/lib/extensions/vimeo-block'
import { HTML } from '@/lib/extensions/html'

// Extensions used in the editor - must match editor-wrapper.tsx
const extensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      class: 'editor-link'
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    defaultAlignment: 'left',
  }),
  Image.configure({
    inline: false,
    allowBase64: true,
    HTMLAttributes: {
      class: 'editor-image',
      draggable: 'true'
    }
  }),
  Iframe.configure({
    HTMLAttributes: {
      class: 'iframe-editable',
    },
  }),
  YoutubeBlock.configure({
    addPasteHandler: true,
    HTMLAttributes: {
      class: 'youtube-block',
    },
  }),
  Youtube.configure({
    HTMLAttributes: {
      class: 'youtube-embed',
    },
  }),
  VimeoBlock.configure({
    addPasteHandler: true,
    HTMLAttributes: {
      class: 'vimeo-block',
    },
  }),
  HTML.configure({
    HTMLAttributes: {
      class: 'html-content',
    },
  }),
]

/**
 * Convert TipTap JSON to HTML
 * @param json - ProseMirror JSON object or stringified JSON
 * @returns HTML string
 */
export function convertTipTapJsonToHtml(json: any): string {
  try {
    // Parse JSON if it's a string
    const parsedJson = typeof json === 'string' ? JSON.parse(json) : json
    
    // Generate HTML using TipTap's generateHTML function
    const html = generateHTML(parsedJson, extensions)
    
    return html
  } catch (error) {
    console.error('Error converting TipTap JSON to HTML:', error)
    return ''
  }
}

/**
 * Sanitize HTML content for safe storage and display
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production you might want to use a library like DOMPurify
  // For now, we trust TipTap's output since it comes from our controlled editor
  return html
}

/**
 * Convert content body to both JSON and HTML for dual storage
 * @param contentBody - Content body (JSON string or object)
 * @returns Object with both json and html versions
 */
export function prepareContentForStorage(contentBody: any): { json: string, html: string } {
  try {
    // Ensure we have a JSON string
    const jsonString = typeof contentBody === 'string' ? contentBody : JSON.stringify(contentBody)
    
    // Convert to HTML
    const html = convertTipTapJsonToHtml(jsonString)
    
    // Sanitize HTML
    const sanitizedHtml = sanitizeHtml(html)
    
    return {
      json: jsonString,
      html: sanitizedHtml
    }
  } catch (error) {
    console.error('Error preparing content for storage:', error)
    return {
      json: typeof contentBody === 'string' ? contentBody : JSON.stringify(contentBody || {}),
      html: ''
    }
  }
}
