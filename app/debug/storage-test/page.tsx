'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, XCircle, Upload, RefreshCw } from 'lucide-react'

export default function StorageDebugPage() {
  const [isFixingStorage, setIsFixingStorage] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [checkResult, setCheckResult] = useState<any>(null)
  const [isCheckingUrl, setIsCheckingUrl] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFixStorage = async () => {
    if (isFixingStorage) return
    
    try {
      setIsFixingStorage(true)
      setFixResult(null)
      
      const response = await fetch('/api/manage/fix-storage-policy', {
        method: 'POST'
      })
      
      const result = await response.json()
      setFixResult(result)
    } catch (error) {
      setFixResult({
        error: error instanceof Error ? error.message : 'Failed to fix storage policies'
      })
    } finally {
      setIsFixingStorage(false)
    }
  }
  
  const handleCheckUrl = async () => {
    if (!imageUrl.trim() || isCheckingUrl) return
    
    try {
      setIsCheckingUrl(true)
      setCheckResult(null)
      
      const response = await fetch(`/api/manage/storage-debug/check-url?url=${encodeURIComponent(imageUrl)}`)
      const result = await response.json()
      setCheckResult(result)
    } catch (error) {
      setCheckResult({
        error: error instanceof Error ? error.message : 'Failed to check URL'
      })
    } finally {
      setIsCheckingUrl(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
    }
  }
  
  const handleUpload = async () => {
    if (!file || isUploading) return
    
    try {
      setIsUploading(true)
      setUploadResult(null)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'editor') // Can be 'editor' or 'thumbnail'
      
      // Get auth token
      const token = localStorage.getItem('supabase_access_token')
      
      const response = await fetch('/api/manage/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      })
      
      const result = await response.json()
      setUploadResult(result)
      
      // If successful, set the URL for checking
      if (result.url) {
        setImageUrl(result.url)
      }
    } catch (error) {
      setUploadResult({
        error: error instanceof Error ? error.message : 'Failed to upload file'
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Storage Debugging Tools</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fix Storage Policies</CardTitle>
            <CardDescription>
              Update Supabase storage policies to allow public access to images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This will recreate storage policies for the thumbnails and images buckets 
              to ensure they are properly accessible.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleFixStorage}
              disabled={isFixingStorage}
            >
              {isFixingStorage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fix Storage Policies
                </>
              )}
            </Button>
          </CardFooter>
          
          {fixResult && (
            <CardContent className="border-t pt-4">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-60">
                {JSON.stringify(fixResult, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Image Upload</CardTitle>
            <CardDescription>
              Upload an image to test storage permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mb-4"
              />
              
              {file && (
                <p className="text-sm">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Test Image
                </>
              )}
            </Button>
          </CardFooter>
          
          {uploadResult && (
            <CardContent className="border-t pt-4">
              <h3 className="font-medium mb-2">Upload Result:</h3>
              {uploadResult.error ? (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  Error: {uploadResult.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Upload successful
                  </div>
                  
                  {uploadResult.url && (
                    <div>
                      <p className="text-sm font-medium mb-2">Image URL:</p>
                      <Input 
                        value={uploadResult.url} 
                        readOnly 
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <div className="mt-4">
                        <img 
                          src={uploadResult.url} 
                          alt="Uploaded test image" 
                          className="max-h-60 rounded-md" 
                          onError={(e) => {
                            e.currentTarget.classList.add('border', 'border-red-500');
                            e.currentTarget.title = "Failed to load image";
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Check Image URL</CardTitle>
            <CardDescription>
              Test if an image URL is publicly accessible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://example.com/path/to/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleCheckUrl}
                disabled={!imageUrl.trim() || isCheckingUrl}
              >
                {isCheckingUrl ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Check URL'
                )}
              </Button>
            </div>
            
            {checkResult && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Check Result:</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-60">
                  {JSON.stringify(checkResult, null, 2)}
                </pre>
                
                {/* Show the image if URL is provided */}
                {imageUrl && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Image Preview:</h3>
                    <div className="relative border rounded-md p-4 bg-gray-50">
                      <img 
                        src={imageUrl} 
                        alt="Image preview" 
                        className="max-h-60 mx-auto"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                          const errorMsg = document.createElement('div');
                          errorMsg.className = 'text-red-500 flex items-center';
                          errorMsg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>Failed to load image';
                          target.parentElement?.appendChild(errorMsg);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 