'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
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
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  Grįžti į pagrindinį
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Solis administravimas</h1>
            </div>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <Link href="/manage" className="text-sm font-medium hover:text-primary">
                    Pagrindinis
                  </Link>
                </li>
                <li>
                  <Link href="/manage/categories" className="text-sm font-medium hover:text-primary">
                    Kategorijos
                  </Link>
                </li>
                <li>
                  <Link href="/manage/content" className="text-sm font-medium hover:text-primary">
                    Turinys
                  </Link>
                </li>
                <li>
                  <Link href="/manage/users" className="text-sm font-medium hover:text-primary">
                    Vartotojai
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        {children}
      </div>
    </ProtectedRoute>
  )
} 