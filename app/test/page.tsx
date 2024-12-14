'use client'

import { useState } from 'react'
import { testDatabaseConnection, testAuth } from '@/lib/test-utils'
import { insertSampleContent, getContentItems } from '@/lib/services/content'
import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/lib/context/auth'

export default function TestPage() {
  const [results, setResults] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

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

  const checkAuth = async () => {
    setIsLoading(true)
    try {
      const result = await testAuth()
      setResults(JSON.stringify(result, null, 2))
    } catch (error) {
      setResults(JSON.stringify(error, null, 2))
    }
    setIsLoading(false)
  }

  const addSampleContent = async () => {
    setIsLoading(true)
    try {
      if (!user) {
        setAuthError('You must be signed in to add sample content')
        return
      }

      const result = await insertSampleContent()
      setResults(JSON.stringify({ message: 'Sample content added:', data: result }, null, 2))
      setAuthError(null)
    } catch (error) {
      if (error instanceof Error && error.message.includes('authenticated')) {
        setAuthError(error.message)
      } else {
        setResults(JSON.stringify({ error: 'Error adding sample content:', details: error }, null, 2))
      }
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

  if (authLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      {!user && (
        <div className="mb-8">
          <AuthForm />
        </div>
      )}

      {authError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {authError}
        </div>
      )}

      <div className="space-x-4 mb-4">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-yellow-500 text-black px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Running Tests...' : 'Run Tests'}
        </button>

        <button
          onClick={checkAuth}
          disabled={isLoading}
          className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Check Auth State
        </button>

        <button
          onClick={addSampleContent}
          disabled={isLoading || !user}
          className="bg-yellow-500 text-black px-4 py-2 rounded disabled:bg-gray-400"
        >
          Add Sample Content
        </button>

        <button
          onClick={viewCurrentContent}
          disabled={isLoading}
          className="bg-black text-white px-4 py-2 rounded disabled:bg-gray-400"
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