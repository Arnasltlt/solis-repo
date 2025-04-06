'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthorization } from '@/hooks/useAuthorization'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function ContentCreateRedirect() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const { isAdmin } = useAuthorization()
  
  useEffect(() => {
    if (loading) return
    
    // Verify authentication
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to access content creation',
        variant: 'destructive'
      })
      router.push('/login?callbackUrl=/manage/content/new')
      return
    }
    
    // Verify admin status
    if (!isAdmin()) {
      toast({
        title: 'Access denied',
        description: 'You need administrator access to create content',
        variant: 'destructive'
      })
      router.push('/')
      return
    }
    
    // Redirect to content creation page if authentication passes
    router.push('/manage/content/new')
  }, [isAuthenticated, loading, isAdmin, router])
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p>Redirecting to content creation page...</p>
    </div>
  )
}