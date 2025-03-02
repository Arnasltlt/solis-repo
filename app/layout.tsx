import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils/index'
import { ThemeProvider } from 'next-themes'
import type { Database } from '@/lib/types/database'

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
  const supabase = createServerComponentClient<Database>({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col h-full`}>
        <Providers session={session}>
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}

