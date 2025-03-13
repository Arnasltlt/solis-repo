'use client'

import { useState, useRef } from 'react'

export default function TestApiUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      
      // Create preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    }
  }
  
  // Handle upload via API
  const handleUpload = async () => {
    if (!file) return
    
    try {
      setIsUploading(true)
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      // Send to API
      const response = await fetch('/api/test-storage', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setUploadResult({
          success: false,
          error: result.error || 'Upload failed'
        })
      } else {
        setUploadResult({
          success: true,
          url: result.url
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Get storage info
  const getStorageInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/test-storage')
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Failed to get storage info:', data.error)
      } else {
        setStorageInfo(data)
      }
    } catch (error) {
      console.error('Error fetching storage info:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Clear everything
  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setUploadResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Storage Upload Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">1. Select Image File</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          
          {previewUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Preview:</h3>
              <div className="relative h-40 w-full rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload via API'}
            </button>
            
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
          
          {uploadResult && (
            <div className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`text-lg font-medium ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
              </h3>
              
              {uploadResult.success && uploadResult.url ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">File URL:</p>
                  <a 
                    href={uploadResult.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {uploadResult.url}
                  </a>
                  <div className="mt-4">
                    <img 
                      src={uploadResult.url} 
                      alt="Uploaded file" 
                      className="max-h-40 border border-gray-200 rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-red-600 mt-2">{uploadResult.error}</p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">2. Storage Information</h2>
          
          <button
            onClick={getStorageInfo}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Get Storage Info'}
          </button>
          
          {storageInfo && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">User:</h3>
              <p className="text-sm text-gray-600 mb-4">
                {storageInfo.user?.email} ({storageInfo.user?.id})
              </p>
              
              <h3 className="text-lg font-medium mb-2">Buckets:</h3>
              <ul className="list-disc pl-5 mb-4">
                {storageInfo.buckets?.map((bucket: any) => (
                  <li key={bucket.id} className="text-sm text-gray-600">
                    {bucket.name} (ID: {bucket.id})
                  </li>
                ))}
              </ul>
              
              <h3 className="text-lg font-medium mb-2">Thumbnail Files:</h3>
              {storageInfo.thumbnailFiles?.length > 0 ? (
                <ul className="list-disc pl-5">
                  {storageInfo.thumbnailFiles.map((file: any) => (
                    <li key={file.id} className="text-sm text-gray-600 mb-1">
                      {file.name} ({Math.round(file.metadata?.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No files found in thumbnails bucket</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 