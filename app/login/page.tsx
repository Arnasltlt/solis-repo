'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/context/auth'
import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { Logo } from '@/components/ui/logo'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Logo size="medium" />
      </div>
      <AuthForm />
    </div>
  )
}
