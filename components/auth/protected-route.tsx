'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    // Skip when still loading
    if (isLoading) return

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
  }, [isAuthenticated, isLoading, hasMinimumRole, requiredRole, router, pathname])

  // Show nothing while loading
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  // Show nothing if not authenticated or doesn't have required role
  if (!isAuthenticated || !hasMinimumRole(requiredRole)) {
    return null
  }

  // Show children if authenticated and has required role
  return <>{children}</>
} 