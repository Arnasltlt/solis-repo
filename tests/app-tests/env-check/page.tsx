'use client'

import { useEffect, useState } from 'react'

export default function EnvCheckPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Only access environment variables with NEXT_PUBLIC prefix
    const publicEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
      // Add a hardcoded value to verify the component is rendering correctly
      TEST_VALUE: 'This is a test value'
    }
    
    setEnvVars(publicEnvVars)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Check</h1>
      
      <div className="mb-4">
        <strong>Is Client:</strong> {isClient ? 'Yes' : 'No'}
      </div>
      
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(envVars, null, 2)}
      </pre>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Hardcoded Values Test</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({
            SUPABASE_URL: 'https://pybqaehxthpxjlboboaq.supabase.co',
            ANON_KEY_AVAILABLE: true
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
} 