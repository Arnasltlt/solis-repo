'use client'

import { useState, useRef } from 'react'
import { createFileCopy, testFileUpload } from '@/lib/utils/debug-utils'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'

interface FileUploadTestProps {
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
  onLog?: (message: string) => void
}

export function FileUploadTest({ onSuccess, onError, onLog }: FileUploadTestProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { supabase, session } = useSupabase()
  
  const log = (message: string) => {
    console.log(message)
    onLog?.(message)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      log(`File selected: ${selectedFile.name} (${selectedFile.size} bytes, ${selectedFile.type})`)
      setFile(selectedFile)
    }
  }
  
  const handleUpload = async () => {
    if (!file) {
      log('Error: No file selected')
      onError?.('No file selected')
      return
    }
    
    if (!supabase) {
      log('Error: Supabase client not initialized')
      onError?.('Supabase client not initialized')
      return
    }
    
    if (!session) {
      log('Error: User not authenticated')
      onError?.('User not authenticated')
      return
    }
    
    try {
      setIsUploading(true)
      log(`Starting upload of ${file.name}...`)
      
      // Step 1: Create a file copy
      log('Creating file copy...')
      const uniqueFileName = `test-component-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
      const copyResult = await createFileCopy(file, uniqueFileName)
      
      if (!copyResult.success || !copyResult.file) {
        const errorMsg = `Failed to create file copy: ${copyResult.error}`
        log(`ERROR: ${errorMsg}`)
        onError?.(errorMsg)
        return
      }
      
      log(`File copy created successfully using method: ${copyResult.method}`)
      
      // Step 2: Upload the file
      log('Uploading file...')
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(copyResult.file.name, copyResult.file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        const errorMsg = `Upload failed: ${error.message}`
        log(`ERROR: ${errorMsg}`)
        onError?.(errorMsg)
        return
      }
      
      log('Upload successful!')
      
      // Step 3: Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(data.path)
      
      log(`Public URL: ${publicUrl}`)
      onSuccess?.(publicUrl)
    } catch (error) {
      const errorMsg = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      log(`ERROR: ${errorMsg}`)
      onError?.(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleClear = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Image File</label>
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
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading || !session}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
        
        <Button
          onClick={handleClear}
          variant="outline"
        >
          Clear
        </Button>
      </div>
      
      {file && (
        <div className="text-sm text-gray-600">
          Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
        </div>
      )}
    </div>
  )
} 