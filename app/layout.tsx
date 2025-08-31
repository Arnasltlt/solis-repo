import './globals.css'
import { Metadata, Viewport } from 'next'
import { Amatic_SC, Roboto } from 'next/font/google'
import { cookies } from 'next/headers'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils/index'
import type { Database } from '@/lib/types/database'
import { createServerClient } from '@supabase/ssr'
import { serializeSession } from '@/lib/utils/serialization'

import { Footer } from '@/components/ui/footer'
import { Navigation } from '@/components/ui/navigation'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const amatic = Amatic_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-amatic'
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-roboto'
})

export const metadata: Metadata = {
  title: 'Solis',
  description: 'Pamokos tėveliams',
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let serializedSession = null;

  try {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session in layout:', error)
    } else {
      serializedSession = serializeSession(session);
    }
  } catch (error) {
    console.error('Failed to initialize Supabase or get session in layout:', error)
  }
  
  return (
    <html lang="en" suppressHydrationWarning className={`${amatic.variable} ${roboto.variable} h-full`}>
      <body className={cn("font-sans", "flex flex-col min-h-screen overflow-x-hidden")}>
        <Providers session={serializedSession}>
          <Navigation />
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

