'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { toast } from '@/hooks/use-toast'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: 'free' | 'premium' | 'administrator'
}

export function ProtectedRoute({
  children,
  requiredRole = 'free',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { hasMinimumRole } = useAuthorization()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Skip when still loading or not on client
    if (isLoading || !isClient) return

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access this page.',
        variant: 'destructive',
      })
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Check for required role
    if (!hasMinimumRole(requiredRole)) {
      toast({
        title: 'Access denied',
        description: `You need ${requiredRole} access to view this page.`,
        variant: 'destructive',
      })
      
      // Redirect to appropriate page based on current role
      router.push('/')
    }
  }, [isAuthenticated, isLoading, hasMinimumRole, requiredRole, router, pathname, isClient])

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isClient) {
    return null
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated or doesn't have required role
  if (!isAuthenticated || !hasMinimumRole(requiredRole)) {
    return null
  }

  // Show children if authenticated and has required role
  return <>{children}</>
} 