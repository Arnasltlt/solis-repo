'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'

interface ManageLayoutClientProps {
  children: React.ReactNode
}

export function ManageLayoutClient({ children }: ManageLayoutClientProps) {
  // Use client-side only rendering to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show a simple loading state until client-side code takes over
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="administrator">
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
} 