'use client'

import React from 'react'
import { Editor } from '@tinymce/tinymce-react'

interface SimpleEditorProps {
  value: string
  onChange: (value: string) => void
}

export function SimpleEditor({ value, onChange }: SimpleEditorProps) {
  return (
    <Editor
      tinymceScriptSrc="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js"
      initialValue={value || '<p>This is the initial content of the editor.</p>'}
      init={{
        height: 500,
        menubar: true,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | help',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 16px; }'
      }}
      onEditorChange={onChange}
    />
  )
} 