'use client'

import { useState } from 'react'
import { testDatabaseConnection } from '@/lib/test-utils'
import { insertSampleContent, getContentItems } from '@/lib/content-service'

export default function TestPage() {
  const [results, setResults] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    try {
      const result = await testDatabaseConnection()
      setResults(JSON.stringify(result, null, 2))
    } catch (error) {
      setResults(JSON.stringify(error, null, 2))
    }
    setIsLoading(false)
  }

  const addSampleContent = async () => {
    setIsLoading(true)
    try {
      const result = await insertSampleContent()
      setResults(JSON.stringify({ message: 'Sample content added:', data: result }, null, 2))
    } catch (error) {
      setResults(JSON.stringify({ error: 'Error adding sample content:', details: error }, null, 2))
    }
    setIsLoading(false)
  }

  const viewCurrentContent = async () => {
    setIsLoading(true)
    try {
      const content = await getContentItems()
      setResults(JSON.stringify({ message: 'Current content:', data: content }, null, 2))
    } catch (error) {
      setResults(JSON.stringify({ error: 'Error fetching content:', details: error }, null, 2))
    }
    setIsLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="space-x-4 mb-4">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Running Tests...' : 'Run Tests'}
        </button>

        <button
          onClick={addSampleContent}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Add Sample Content
        </button>

        <button
          onClick={viewCurrentContent}
          disabled={isLoading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          View Current Content
        </button>
      </div>
      
      {results && (
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-[600px]">
          {results}
        </pre>
      )}
    </div>
  )
} 