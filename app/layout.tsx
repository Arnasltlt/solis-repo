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
import Script from 'next/script'

import { Footer } from '@/components/ui/footer'
import { Navigation } from '@/components/ui/navigation'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { CookieConsentBanner } from '@/components/ui/cookie-consent'

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
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){
            if (window.location.hostname !== 'biblioteka.soliopamoka.lt') return;
            var consent = ('; '+document.cookie).split('; solis_consent_analytics=').pop().split(';').shift();
            var loadHotjar = function(){
              if (window.__hotjarLoaded) return; window.__hotjarLoaded = true;
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:6509921,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            };
            if (consent === '1') { loadHotjar(); }
            window.addEventListener('solis-consent-analytics-granted', loadHotjar);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
        <Providers session={serializedSession}>
          <Navigation />
          <main className="flex-1">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <Toaster />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  )
}

