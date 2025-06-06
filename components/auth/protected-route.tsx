'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, UserRoles } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { toast } from '@/components/ui/use-toast'
import { useSupabase } from '@/components/supabase-provider'
import { Loader2 } from 'lucide-react'
import { isBrowser } from '@/lib/utils/index'

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredRole?: UserRoles
  forcedReturnUrl?: string
}

export function ProtectedRoute({
  children,
  requiredRole = UserRoles.FREE,
  forcedReturnUrl,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { hasMinimumRole } = useAuthorization()
  const { session } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || loading || authCheckComplete) return;
    
    const isSessionValid = !!user || !!session;
    
    if (isSessionValid) {
      setAuthCheckComplete(true);
      
      if (requiredRole !== UserRoles.FREE && !hasMinimumRole(requiredRole)) {
        console.log(`Role check failed: user does not have minimum required role: ${requiredRole}`);
        toast({
          title: 'Access denied',
          description: `You need ${requiredRole} access to view this page.`,
          variant: 'destructive',
        });
        router.push('/');
      } 
      return;
    }
    
    if (!redirecting) {
      setRedirecting(true);
      if (isBrowser()) {
        const returnUrl = forcedReturnUrl || pathname;
        const encodedReturnUrl = encodeURIComponent(returnUrl);
        toast({
          title: 'Authentication required',
          description: 'Please sign in to access this page',
          variant: 'destructive',
        });
        router.push(`/login?returnUrl=${encodedReturnUrl}`);
      }
    }
  }, [user, session, loading, router, pathname, hasMinimumRole, requiredRole, forcedReturnUrl, isClient, authCheckComplete, redirecting]);

  if (!isClient || loading || !authCheckComplete) {
    return (
      <div className="flex items-center justify-center h-full w-full py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  return <>{children}</>;
} 