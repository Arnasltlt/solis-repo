'use client'

import { AuthProvider } from '@/lib/context/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
} 