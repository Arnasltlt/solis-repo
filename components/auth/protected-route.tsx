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
  const { supabase, session } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [granted, setGranted] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    let roleTimeout: any

    const verify = async () => {
      if (!isClient || loading) return
      setVerifying(true)

      // Explicitly fetch session to avoid transient nulls on tab switches
      const { data } = await supabase!.auth.getSession()
      const activeSession = data.session || session

      const isSessionValid = !!user || !!activeSession

      if (cancelled) return

      if (isSessionValid) {
        // If role requirement is met, mark as granted and stop gating UI
        if (requiredRole === UserRoles.FREE || hasMinimumRole(requiredRole)) {
          setAuthCheckComplete(true)
          setGranted(true)
          setVerifying(false)
          return
        }

        // Otherwise, allow a short grace window for role derivation
          // Grace window for role derivation (e.g., admin derived from tier)
          roleTimeout = setTimeout(() => {
            if (cancelled) return
            if (!hasMinimumRole(requiredRole)) {
              console.log(`Role check failed: user does not have minimum required role: ${requiredRole}`)
              console.log('User details:', { userRole: user?.role, hasMinimumRole: hasMinimumRole(requiredRole) })
              toast({
                title: 'Prieiga uždrausta',
                description: `Jums reikia ${requiredRole} prieigos, kad matytumėte šį puslapį.`,
                variant: 'destructive',
              })
              router.push('/?error=Insufficient+permissions')
            } else {
              // Role became available within grace period; allow access without gating
              setAuthCheckComplete(true)
              setGranted(true)
            }
            setVerifying(false)
          }, 400)
          return
      }

      // Grace period to avoid flicker redirects on tab switch
      roleTimeout = setTimeout(() => {
        if (cancelled) return
        if (!redirecting) {
          setRedirecting(true)
          if (isBrowser()) {
            const returnUrl = forcedReturnUrl || pathname
            const encodedReturnUrl = encodeURIComponent(returnUrl)
            console.log('Redirecting to login:', { returnUrl, encodedReturnUrl })
            toast({
              title: 'Reikalingas autentifikavimas',
              description: 'Prisijunkite, kad pasiektumėte šį puslapį',
              variant: 'destructive',
            })
            router.push(`/login?returnUrl=${encodedReturnUrl}`)
          }
        }
        setVerifying(false)
      }, 400)
    }

    verify()

    // Re-verify when tab becomes visible again
    const onVisibility = () => {
      if (!document.hidden) {
        setRedirecting(false)
        // If already granted, re-verify silently without gating UI
        if (granted) {
          verify()
          return
        }
        verify()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      if (roleTimeout) clearTimeout(roleTimeout)
      setVerifying(false)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user, session, loading, router, pathname, hasMinimumRole, requiredRole, forcedReturnUrl, isClient, supabase])

  if (!granted && (!isClient || loading || !authCheckComplete || verifying)) {
    return (
      <div className="flex items-center justify-center h-full w-full py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Tikrinama autentifikacija...</span>
      </div>
    );
  }

  return <>{children}</>;
} 