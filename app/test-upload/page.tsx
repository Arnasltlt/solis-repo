'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadThumbnail } from '@/lib/utils/storage-utils'
import { useSupabase } from '@/components/supabase-provider'
import { createContent } from '@/lib/services/content'
import type { ContentFormData } from '@/lib/types/content'
import { analyzeFile, createFileCopy, testFileUpload } from '@/lib/utils/debug-utils'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; url: string; error?: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { supabase, session } = useSupabase()
  
  // Content form state
  const [title, setTitle] = useState('Test Content Item')
  const [description, setDescription] = useState('This is a test content item created from the test page')
  const [contentType, setContentType] = useState<'video' | 'audio' | 'lesson_plan' | 'game'>('lesson_plan')
  const [contentBody, setContentBody] = useState('<p>This is the content body</p>')
  const [published, setPublished] = useState(false)
  const [ageGroups, setAgeGroups] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [accessTiers, setAccessTiers] = useState<{id: string, name: string}[]>([])
  const [selectedAccessTier, setSelectedAccessTier] = useState('')
  const [isCreatingContent, setIsCreatingContent] = useState(false)
  const [contentResult, setContentResult] = useState<{success: boolean, data?: any, error?: string} | null>(null)
  
  // Fetch age groups, categories, and access tiers on mount
  useEffect(() => {
    async function fetchMetadata() {
      if (!supabase) return
      
      try {
        addLog('Fetching metadata (age groups, categories, access tiers)...')
        
        // Fetch age groups
        const { data: ageGroupsData, error: ageGroupsError } = await supabase
          .from('age_groups')
          .select('*')
        
        if (ageGroupsError) {
          addLog(`Error fetching age groups: ${ageGroupsError.message}`)
        } else {
          addLog(`Fetched ${ageGroupsData.length} age groups`)
          setAgeGroups(ageGroupsData.map(ag => ag.id))
        }
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
        
        if (categoriesError) {
          addLog(`Error fetching categories: ${categoriesError.message}`)
        } else {
          addLog(`Fetched ${categoriesData.length} categories`)
          setCategories(categoriesData.map(c => c.id))
        }
        
        // Fetch access tiers
        const { data: accessTiersData, error: accessTiersError } = await supabase
          .from('access_tiers')
          .select('*')
        
        if (accessTiersError) {
          addLog(`Error fetching access tiers: ${accessTiersError.message}`)
        } else {
          addLog(`Fetched ${accessTiersData.length} access tiers`)
          setAccessTiers(accessTiersData)
          
          // Set default access tier to 'free' if available
          const freeTier = accessTiersData.find(tier => tier.name === 'free')
          if (freeTier) {
            setSelectedAccessTier(freeTier.id)
            addLog(`Selected default access tier: ${freeTier.name} (${freeTier.id})`)
          } else if (accessTiersData.length > 0) {
            setSelectedAccessTier(accessTiersData[0].id)
            addLog(`Selected first available access tier: ${accessTiersData[0].name} (${accessTiersData[0].id})`)
          }
        }
      } catch (error) {
        addLog(`Error fetching metadata: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    fetchMetadata()
  }, [supabase])
  
  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`])
  }
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      addLog(`File selected: ${selectedFile.name} (${selectedFile.size} bytes, ${selectedFile.type})`)
      setFile(selectedFile)
      
      // Create preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
    }
  }
  
  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      addLog('Error: No file selected')
      return
    }
    
    if (!supabase) {
      addLog('Error: Supabase client not initialized')
      return
    }
    
    if (!session) {
      addLog('Error: User not authenticated')
      return
    }
    
    try {
      setIsUploading(true)
      addLog(`Starting upload of ${file.name}...`)
      
      // Override console.log to capture logs
      const originalConsoleLog = console.log
      const originalConsoleError = console.error
      const originalConsoleWarn = console.warn
      
      console.log = (...args) => {
        originalConsoleLog(...args)
        addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '))
      }
      
      console.error = (...args) => {
        originalConsoleError(...args)
        addLog(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`)
      }
      
      console.warn = (...args) => {
        originalConsoleWarn(...args)
        addLog(`WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`)
      }
      
      // Perform the upload
      const result = await uploadThumbnail(supabase, file)
      
      // Restore console functions
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      
      if (result.error) {
        addLog(`Upload failed: ${result.error.message}`)
        setUploadResult({
          success: false,
          url: result.url,
          error: result.error.message
        })
      } else {
        addLog(`Upload successful! URL: ${result.url}`)
        setUploadResult({
          success: true,
          url: result.url
        })
      }
    } catch (error) {
      addLog(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      setUploadResult({
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Handle direct upload to test the storage API
  const handleDirectUpload = async () => {
    if (!file || !supabase) return
    
    try {
      setIsUploading(true)
      addLog(`Starting direct upload of ${file.name}...`)
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `direct-test-${Date.now()}.${fileExt}`
      
      // Upload directly to Supabase storage
      const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        addLog(`Direct upload failed: ${error.message}`)
        setUploadResult({
          success: false,
          url: '',
          error: error.message
        })
      } else {
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(data.path)
        
        addLog(`Direct upload successful! URL: ${publicUrl}`)
        setUploadResult({
          success: true,
          url: publicUrl
        })
      }
    } catch (error) {
      addLog(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
      setUploadResult({
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Handle content creation
  const handleCreateContent = async () => {
    if (!supabase) {
      addLog('Error: Supabase client not initialized')
      return
    }
    
    if (!session) {
      addLog('Error: User not authenticated')
      return
    }
    
    if (!selectedAccessTier) {
      addLog('Error: No access tier selected')
      return
    }
    
    if (ageGroups.length === 0) {
      addLog('Error: No age groups available')
      return
    }
    
    if (categories.length === 0) {
      addLog('Error: No categories available')
      return
    }
    
    try {
      setIsCreatingContent(true)
      addLog('Creating content item...')
      
      // Override console.log to capture logs
      const originalConsoleLog = console.log
      const originalConsoleError = console.error
      const originalConsoleWarn = console.warn
      
      console.log = (...args) => {
        originalConsoleLog(...args)
        addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '))
      }
      
      console.error = (...args) => {
        originalConsoleError(...args)
        addLog(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`)
      }
      
      console.warn = (...args) => {
        originalConsoleWarn(...args)
        addLog(`WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`)
      }
      
      // Prepare content data
      const contentData: ContentFormData = {
        title,
        description,
        type: contentType,
        contentBody,
        ageGroups: [ageGroups[0]], // Just use the first age group for testing
        categories: [categories[0]], // Just use the first category for testing
        accessTierId: selectedAccessTier,
        published,
        thumbnail: file
      }
      
      addLog(`Content data prepared: ${JSON.stringify({
        ...contentData,
        thumbnail: file ? `File: ${file.name} (${file.size} bytes)` : null,
        contentBody: contentData.contentBody ? `${contentData.contentBody.length} chars` : null
      })}`)
      
      // Create content
      const result = await createContent(contentData, supabase)
      
      // Restore console functions
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      
      addLog(`Content created successfully: ${JSON.stringify({
        id: result.id,
        title: result.title,
        slug: result.slug,
        thumbnail_url: result.thumbnail_url
      })}`)
      
      setContentResult({
        success: true,
        data: result
      })
    } catch (error) {
      addLog(`Error creating content: ${error instanceof Error ? error.message : String(error)}`)
      setContentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsCreatingContent(false)
    }
  }
  
  // Clear everything
  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setUploadResult(null)
    setContentResult(null)
    setLogs([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  
  // Add a new button for comprehensive testing
  const handleComprehensiveTest = async () => {
    if (!file) {
      addLog('Error: No file selected')
      return
    }
    
    if (!supabase) {
      addLog('Error: Supabase client not initialized')
      return
    }
    
    if (!session) {
      addLog('Error: User not authenticated')
      return
    }
    
    try {
      setIsUploading(true)
      addLog(`Starting comprehensive test for ${file.name}...`)
      
      // Step 1: Analyze the file
      addLog('Step 1: Analyzing file...')
      const fileAnalysis = analyzeFile(file)
      addLog(`File analysis: ${JSON.stringify(fileAnalysis, null, 2)}`)
      
      // Step 2: Test file copying
      addLog('Step 2: Testing file copying methods...')
      const uniqueFileName = `test-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
      const copyResult = await createFileCopy(file, uniqueFileName)
      addLog(`File copy result (${copyResult.method}): ${JSON.stringify(copyResult.details || {}, null, 2)}`)
      
      if (!copyResult.success) {
        addLog(`ERROR: Failed to create file copy: ${copyResult.error}`)
        setUploadResult({
          success: false,
          url: '',
          error: `Failed to create file copy: ${copyResult.error}`
        })
        return
      }
      
      // Step 3: Test multiple upload methods
      addLog('Step 3: Testing multiple upload methods...')
      const uploadTestResult = await testFileUpload(supabase, file)
      
      addLog(`Upload test results: ${JSON.stringify(uploadTestResult.results, null, 2)}`)
      
      if (uploadTestResult.success) {
        // Find the first successful method
        const successfulMethod = uploadTestResult.results.find(r => r.success)
        if (successfulMethod) {
          addLog(`Found successful upload method: ${successfulMethod.method}`)
          setUploadResult({
            success: true,
            url: successfulMethod.url
          })
        }
      } else {
        addLog('ERROR: All upload methods failed')
        setUploadResult({
          success: false,
          url: '',
          error: 'All upload methods failed'
        })
      }
    } catch (error) {
      addLog(`Unexpected error during comprehensive test: ${error instanceof Error ? error.message : String(error)}`)
      setUploadResult({
        success: false,
        url: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Content Creation Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Authentication Status</h2>
        <div className="p-4 bg-gray-50 rounded-md">
          {session ? (
            <div className="text-green-600">
              ✅ Authenticated as {session.user.email}
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Not authenticated - Please log in first
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">2. Select Image File</h2>
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
            <div className="relative h-40 w-full max-w-md rounded-lg overflow-hidden border border-gray-200">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading || !session}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Test Upload Only'}
          </button>
          
          <button
            onClick={handleDirectUpload}
            disabled={!file || isUploading || !session}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Direct Upload
          </button>
          
          <button
            onClick={handleComprehensiveTest}
            disabled={!file || isUploading || !session}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Comprehensive Test
          </button>
        </div>
        
        {uploadResult && (
          <div className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className={`text-lg font-medium ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
            </h3>
            
            {uploadResult.success ? (
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
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">3. Content Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="lesson_plan">Lesson Plan</option>
              <option value="game">Game</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Body</label>
            <textarea
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Tier</label>
            <select
              value={selectedAccessTier}
              onChange={(e) => setSelectedAccessTier(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={accessTiers.length === 0}
            >
              {accessTiers.length === 0 ? (
                <option value="">Loading access tiers...</option>
              ) : (
                accessTiers.map(tier => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))
              )}
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              Published
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleCreateContent}
            disabled={isCreatingContent || !session || !file || ageGroups.length === 0 || categories.length === 0 || !selectedAccessTier}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isCreatingContent ? 'Creating...' : 'Create Content Item'}
          </button>
          
          <button
            onClick={handleClear}
            className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Clear All
          </button>
        </div>
        
        {contentResult && (
          <div className={`mt-4 p-4 rounded-md ${contentResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className={`text-lg font-medium ${contentResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {contentResult.success ? 'Content Created Successfully!' : 'Content Creation Failed'}
            </h3>
            
            {contentResult.success ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Content Details:</p>
                <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-auto">
                  {JSON.stringify(contentResult.data, null, 2)}
                </pre>
                
                {contentResult.data?.thumbnail_url && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Thumbnail:</p>
                    <img 
                      src={contentResult.data.thumbnail_url} 
                      alt="Content thumbnail" 
                      className="max-h-40 border border-gray-200 rounded-md"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600 mt-2">{contentResult.error}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">4. Logs</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log.includes('ERROR') ? (
                  <span className="text-red-400">{log}</span>
                ) : log.includes('WARN') ? (
                  <span className="text-yellow-400">{log}</span>
                ) : log.includes('successful') || log.includes('SUCCEEDED') || log.includes('PASSED') ? (
                  <span className="text-green-400">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 