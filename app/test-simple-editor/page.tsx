'use client'

import { useState } from 'react'
import { UltraSimpleEditor } from '@/components/editor/ultra-simple-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestSimpleEditorPage() {
  const [editorContent, setEditorContent] = useState('')
  const [showOutput, setShowOutput] = useState(false)

  const handleEditorChange = (content: string) => {
    setEditorContent(content)
  }

  const handleSave = async () => {
    console.log('Saving content:', editorContent)
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simple YouTube Editor Test</h1>
        <p className="text-gray-600">
          <strong>✅ This is the simple, bulletproof solution!</strong> Uses React-Quill with direct iframe embedding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>
              Click the ▶ button in the toolbar or try these YouTube URLs:
              <br />• https://www.youtube.com/watch?v=dQw4w9WgXcQ
              <br />• https://youtu.be/dQw4w9WgXcQ  
              <br />• https://www.youtube.com/shorts/dQw4w9WgXcQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UltraSimpleEditor
              initialContent=""
              onChange={handleEditorChange}
              onSave={handleSave}
              className="min-h-[400px]"
            />
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Content Output</CardTitle>
                <CardDescription>See what gets saved to the database</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOutput(!showOutput)}
              >
                {showOutput ? 'Hide' : 'Show'} Output
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showOutput && (
              <div>
                <h3 className="font-semibold mb-2">Raw HTML Content:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                  {editorContent || 'No content yet'}
                </pre>
              </div>
            )}
            
            {/* Read-only preview */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Customer Preview:</h3>
              <div className="border rounded-lg">
                <UltraSimpleEditor
                  initialContent={editorContent}
                  onChange={() => {}} // No-op for read-only
                  readOnly={true}
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>✅ Why This Solution Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Simple & Reliable:</h4>
              <ul className="text-sm space-y-1">
                <li>• React-Quill is proven and stable</li>
                <li>• Direct iframe insertion (no complex plugins)</li>
                <li>• Standard HTML storage</li>
                <li>• Works everywhere</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Test Instructions:</h4>
              <ol className="text-sm space-y-1">
                <li>1. Click the ▶ button in the editor toolbar</li>
                <li>2. Paste any YouTube URL</li>
                <li>3. Click "Add YouTube Video"</li>
                <li>4. Video should appear immediately</li>
                <li>5. Check customer preview below</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Expected Result:</p>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• YouTube videos embed instantly in the editor</li>
              <li>• Videos play directly in both editor and customer view</li>
              <li>• Content is saved as clean HTML with iframe tags</li>
              <li>• No complex JSON or plugin dependencies</li>
              <li>• Works consistently across all scenarios</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}