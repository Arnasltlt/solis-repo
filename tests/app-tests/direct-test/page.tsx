'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function DirectTestPage() {
  const [result, setResult] = useState<string>('Click the button to test')
  const [isLoading, setIsLoading] = useState(false)

  const testSupabase = async () => {
    setIsLoading(true)
    setResult('Testing Supabase connection...')
    
    try {
      // Create Supabase client directly with hardcoded values
      const supabase = createClient(
        'https://pybqaehxthpxjlboboaq.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5YnFhZWh4dGhweGpsYm9ib2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMjgzMTcsImV4cCI6MjA0OTcwNDMxN30.WpnpFGbFfiy-Trp516zL-oJyAI5kX0vZuO1met_MaHc'
      )
      
      // Test a simple query
      const { data, error } = await supabase
        .from('age_groups')
        .select('*')
        .limit(3)
      
      if (error) {
        setResult(`Error: ${error.message}`)
      } else {
        setResult(`Success! Found ${data.length} age groups:\n${JSON.stringify(data, null, 2)}`)
      }
    } catch (error: any) {
      setResult(`Exception: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Supabase Test</h1>
      <p className="mb-4">This page tests Supabase connection with hardcoded credentials.</p>
      
      <button
        onClick={testSupabase}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Supabase Connection'}
      </button>
      
      <pre className="bg-gray-100 p-4 rounded">
        {result}
      </pre>
    </div>
  )
} 