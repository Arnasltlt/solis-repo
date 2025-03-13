'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

// Dynamically import Quill with no SSR
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-[500px] flex items-center justify-center">Loading editor...</div>
})

// Import Quill styles
import 'react-quill/dist/quill.snow.css'

export default function EditorTestPage() {
  const [content, setContent] = useState<string>('<p>This is the initial content of the editor.</p>')
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  
  // Ensure we're running on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Quill modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }
  
  // Show a loading state until client-side code takes over
  if (!isClient) {
    return (
      <div className="container py-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">Loading editor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quill Editor Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 border rounded-md overflow-hidden h-[500px]">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="h-full"
            />
          </div>
          <div className="mt-4">
            <Button onClick={() => router.push('/manage/content')}>
              Back to Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
