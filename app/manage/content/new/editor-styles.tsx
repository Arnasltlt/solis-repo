'use client'

export function EditorStyles() {
  return (
    <style jsx global>{`
      /* Ensure editor text is always visible */
      .ProseMirror {
        color: rgb(17 24 39) !important;
        min-height: 200px;
      }
      
      .ProseMirror p {
        color: rgb(17 24 39) !important;
      }
      
      .ProseMirror h1, 
      .ProseMirror h2, 
      .ProseMirror h3 {
        color: rgb(17 24 39) !important;
      }
      
      .ProseMirror blockquote {
        color: rgb(75 85 99) !important;
        border-left: 4px solid #e5e7eb;
        padding-left: 1rem;
        margin-left: 0;
      }
      
      .ProseMirror ul li, 
      .ProseMirror ol li {
        color: rgb(17 24 39) !important;
      }
      
      /* Ensure links are visible but still styled as links */
      .ProseMirror a {
        color: rgb(37 99 235) !important;
        text-decoration: underline;
      }
      
      /* Ensure iframe nodes are properly displayed */
      .iframe-read-only, .iframe-editable {
        width: 100%;
        aspect-ratio: 16 / 9;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        margin: 1rem 0;
      }
    `}</style>
  )
} 