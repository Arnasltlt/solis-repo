'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { toast } from '@/hooks/use-toast'
import { useSupabase } from '@/components/supabase-provider'
import { Loader2 } from 'lucide-react'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: 'free' | 'premium' | 'administrator'
  forcedReturnUrl?: string // Allow overriding the returnUrl
}

export function ProtectedRoute({
  children,
  requiredRole = 'free',
  forcedReturnUrl,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { hasMinimumRole } = useAuthorization()
  const { session } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Enhanced auth check that combines useAuth and session
  useEffect(() => {
    if (!isClient) return;
    
    // If we're still loading or have already completed, don't do anything
    if (isLoading || authCheckComplete) return;
    
    console.log('ProtectedRoute auth check:', {
      isAuthenticated,
      hasUser: !!user,
      hasSession: !!session,
      isLoading,
      retryCount,
      pathname,
      userEmail: user?.email
    });
    
    // If either of these is true, consider the user authenticated
    const isSessionValid = isAuthenticated || !!session || !!user;
    
    if (isSessionValid) {
      // User is authenticated, check role if needed
      setAuthCheckComplete(true);
      console.log('Authentication successful, user is authenticated');
      
      if (requiredRole !== 'free' && !hasMinimumRole(requiredRole)) {
        console.log(`Role check failed: user does not have required role: ${requiredRole}`);
        toast({
          title: 'Access denied',
          description: `You need ${requiredRole} access to view this page.`,
          variant: 'destructive',
        });
        
        // Redirect to home page
        router.push('/');
      } else {
        console.log(`Role check successful: ${requiredRole}`);
      }
      
      return;
    }
    
    // Not authenticated - try more times before redirecting
    if (retryCount >= 10) { // Increased from 6 to 10 (5 seconds instead of 3)
      // After retries, redirect to login
      const returnUrl = forcedReturnUrl || pathname;
      const loginUrl = `/login?callbackUrl=${encodeURIComponent(returnUrl)}`;
      
      console.log(`Redirecting to login after ${retryCount} retries:`, loginUrl);
      
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access this page.',
        variant: 'destructive',
      });
      
      if (!redirecting) {
        setRedirecting(true);
        router.push(loginUrl);
        setAuthCheckComplete(true);
      }
      return;
    }
    
    console.log(`Authentication retry ${retryCount + 1}/10 - waiting for auth state...`);
    
    // Try again after a delay
    const timer = setTimeout(() => {
      setRetryCount(prev => prev + 1);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [
    isAuthenticated, isLoading, hasMinimumRole, requiredRole, 
    router, pathname, isClient, user, session, retryCount, 
    authCheckComplete, forcedReturnUrl
  ]);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading || !authCheckComplete) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-500">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated or doesn't have required role
  if (!isAuthenticated && !session) {
    return null;
  }

  // Show children if authentication checks passed
  return <>{children}</>;
} 