'use client'

import { useState } from 'react'
import { FixedYouTubeEditor } from '@/components/editor/fixed-youtube-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestYouTubeEditorPage() {
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

  // Parse and render the content for display
  const renderContent = () => {
    if (!editorContent) return <p className="text-gray-500">No content yet</p>

    try {
      const parsed = JSON.parse(editorContent)
      return (
        <div>
          <h3 className="font-semibold mb-2">Parsed JSON Content:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      )
    } catch (e) {
      return (
        <div>
          <h3 className="font-semibold mb-2">Raw Content:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {editorContent}
          </pre>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">YouTube Editor Test</h1>
        <p className="text-gray-600">
          Test the YouTube embedding functionality. Try adding a YouTube video using the video button in the toolbar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>
              Try these YouTube URLs:
              <br />• https://www.youtube.com/watch?v=dQw4w9WgXcQ
              <br />• https://youtu.be/dQw4w9WgXcQ  
              <br />• https://www.youtube.com/shorts/dQw4w9WgXcQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FixedYouTubeEditor
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
            {showOutput && renderContent()}
            
            {/* Read-only preview */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Read-only Preview:</h3>
              <div className="border rounded-lg">
                <FixedYouTubeEditor
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
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click the <strong>video icon</strong> in the toolbar above</li>
            <li>Paste any YouTube URL (examples provided above)</li>
            <li>Click "Add YouTube Video"</li>
            <li>The video should appear embedded in the editor</li>
            <li>Check the "Read-only Preview" to see how it renders for customers</li>
            <li>The "Content Output" shows what gets saved to your database</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">What to expect:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• YouTube videos should embed immediately in the editor</li>
              <li>• Videos should play directly in the editor and preview</li>
              <li>• Content is saved as structured JSON (ProseMirror format)</li>
              <li>• Both editor and read-only views should show videos correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}