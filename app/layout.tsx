import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils/index'
import type { Database } from '@/lib/types/database'
import { serializeSession } from '@/lib/utils/serialization'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

import { Footer } from '@/components/ui/footer'
import { Navigation } from '@/components/ui/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Solis',
    template: '%s | Solis',
  },
  description: 'Solis - learn and grow',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null;
  
  try {
    // Get the Supabase client
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Try to get the session
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session in layout:', error)
    } else {
      session = data.session;
    }
  } catch (error) {
    console.error('Failed to initialize Supabase or get session:', error)
  }

  // Use specialized serializer for session data
  const serializedSession = serializeSession(session)

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={cn(inter.className, "flex flex-col h-full")}>
        <Providers session={serializedSession}>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}

