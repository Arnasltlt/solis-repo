'use client'

import { ThemeProvider } from "next-themes"
import { SupabaseProvider } from '@/components/supabase-provider'
import { AuthProvider } from '@/hooks/useAuth'
import { ContentDeleteProvider } from '@/components/content/ContentDeleteManager'

// Using a more generic type for session to avoid serialization issues
export function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode
  session: any
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SupabaseProvider session={session}>
        <AuthProvider initialSession={session}>
          <ContentDeleteProvider>
            {children}
          </ContentDeleteProvider>
        </AuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
}