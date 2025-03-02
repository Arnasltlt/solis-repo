'use client'

import { ThemeProvider } from "next-themes"
import { SupabaseProvider } from '@/components/supabase-provider'
import { AuthProvider } from '@/hooks/useAuth'
import { Session } from '@supabase/supabase-js'

export function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SupabaseProvider session={session}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
}