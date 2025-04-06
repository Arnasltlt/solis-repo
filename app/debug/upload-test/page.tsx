'use client'

import React, { useState } from 'react'

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }
    
    setIsUploading(true)
    setError(null)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('DEBUG: Sending file', {
        name: file.name,
        size: file.size,
        type: file.type
      })
      
      const response = await fetch('/api/manage/storage-debug/test-thumbnail-upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      setResult(data)
      console.log('DEBUG: Upload result:', data)
    } catch (err) {
      console.error('DEBUG: Upload error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Thumbnail Upload Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Image File</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="border border-gray-300 rounded p-2 w-full"
          />
        </div>
        
        {file && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">Selected file: {file.name} ({Math.round(file.size / 1024)} KB)</p>
            {file.type.startsWith('image/') && (
              <div className="mt-2 border border-gray-200 rounded p-2">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="max-h-48 mx-auto"
                />
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
            <p className="font-medium">Success:</p>
            <p>File uploaded successfully!</p>
            {result.url && (
              <div className="mt-2">
                <p className="mb-2">Image URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.url}</a></p>
                <img src={result.url} alt="Uploaded" className="max-h-48 border border-gray-200 p-1 rounded" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 