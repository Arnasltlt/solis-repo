'use client'

export function EditorStyles() {
  return (
    <style jsx global>{`
      /* Base editor styles */
      .ProseMirror {
        color: rgb(17 24 39) !important;
        min-height: 200px;
        padding: 1rem;
        outline: none;
      }
      
      /* Typography */
      .ProseMirror p {
        color: rgb(17 24 39) !important;
        margin-bottom: 1rem;
        line-height: 1.5;
      }
      
      .ProseMirror h1, 
      .ProseMirror h2, 
      .ProseMirror h3 {
        color: rgb(17 24 39) !important;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .ProseMirror h1 {
        font-size: 1.875rem;
        line-height: 2.25rem;
      }
      
      .ProseMirror h2 {
        font-size: 1.5rem;
        line-height: 2rem;
      }
      
      .ProseMirror h3 {
        font-size: 1.25rem;
        line-height: 1.75rem;
      }
      
      /* Blockquotes */
      .ProseMirror blockquote {
        color: rgb(75 85 99) !important;
        border-left: 4px solid #e5e7eb;
        padding-left: 1rem;
        margin-left: 0;
        margin-right: 0;
        margin-top: 1rem;
        margin-bottom: 1rem;
        font-style: italic;
      }
      
      /* Lists */
      .ProseMirror ul,
      .ProseMirror ol {
        padding-left: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .ProseMirror ul li, 
      .ProseMirror ol li {
        color: rgb(17 24 39) !important;
        margin-bottom: 0.5rem;
      }
      
      /* Links */
      .ProseMirror a {
        color: rgb(37 99 235) !important;
        text-decoration: underline;
        transition: color 0.2s ease;
      }
      
      .ProseMirror a:hover {
        color: rgb(29 78 216) !important;
      }
      
      /* Iframe nodes */
      .ProseMirror iframe,
      .iframe-read-only, 
      .iframe-editable {
        width: 100%;
        aspect-ratio: 16 / 9;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        margin: 1rem 0;
        background-color: #f9fafb;
      }
      
      /* Invalid iframe placeholder */
      .invalid-iframe-placeholder {
        width: 100%;
        aspect-ratio: 16 / 9;
        border: 1px dashed #ef4444;
        border-radius: 0.5rem;
        margin: 1rem 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ef4444;
        background-color: #fef2f2;
      }
      
      /* Images */
      .ProseMirror img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        margin: 1rem 0;
      }
      
      /* Selected node styling */
      .ProseMirror img.ProseMirror-selectednode {
        outline: 2px solid #3b82f6;
      }
      
      .ProseMirror .ProseMirror-selectednode {
        outline: 2px solid #3b82f6;
      }
    `}</style>
  )
} 