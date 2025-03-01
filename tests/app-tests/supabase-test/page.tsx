'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function SupabaseTestPage() {
  const [status, setStatus] = useState('Loading...')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testSupabaseConnection() {
      try {
        setStatus('Creating Supabase client...')
        
        // Get environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseKey) {
          setError('Environment variables are not set')
          setStatus('Failed')
          return
        }
        
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        setStatus('Querying age_groups table...')
        
        // Test a simple query
        const { data, error } = await supabase
          .from('age_groups')
          .select('*')
          .limit(3)
        
        if (error) {
          setError(error.message)
          setStatus('Failed')
          return
        }
        
        setData(data)
        setStatus('Success')
      } catch (error: any) {
        setError(error.message)
        setStatus('Exception')
      }
    }
    
    testSupabaseConnection()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {data && (
        <div className="mb-4">
          <strong>Data:</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mb-4">
        <strong>Environment Variables:</strong>
        <pre className="bg-gray-100 p-4 rounded mt-2">
          NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
          <br />
          NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'}
        </pre>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">API Test</h2>
        <a 
          href="/api/test-supabase" 
          target="_blank" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API Route
        </a>
      </div>
    </div>
  )
} 