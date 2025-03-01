import './globals.css'
import { theme } from '@/styles/theme'
import { Amatic_SC, Roboto } from 'next/font/google'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Providers from './providers'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils/index'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { SupabaseProvider } from '@/components/supabase-provider'
import { ToastProvider } from '@/components/ui/use-toast'
import type { Database } from '@/lib/types/database'

const amatic = Amatic_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-amatic',
})

const roboto = Roboto({
  weight: ['300'],
  subsets: ['latin'],
  variable: '--font-roboto',
})

const fontSans = roboto

export const metadata = {
  title: 'Solis - Vaikų ugdymo platforma',
  description: 'Šokio, muzikos ir kultūros ugdymo platforma vaikams',
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
    <html lang="lt" className={`${amatic.variable} ${roboto.variable}`}>
      <head>
        <style>
          {`
            body {
              font-family: ${theme.fonts.base};
              background-color: ${theme.colors.gray[50]};
              color: ${theme.colors.black};
            }

            h1, h2, h3, h4, h5, h6 {
              font-family: var(--font-amatic);
              font-weight: 700;
            }

            /* Brand Button Styles */
            .btn-primary {
              background-color: ${theme.colors.primary};
              color: ${theme.colors.black};
              font-weight: bold;
              padding: 0.5rem 1rem;
              border-radius: ${theme.borderRadius.md};
              transition: all 0.2s;
            }
            .btn-primary:hover {
              filter: brightness(0.95);
            }

            /* Brand Input Styles */
            .input-brand {
              border: 2px solid ${theme.colors.gray[200]};
              border-radius: ${theme.borderRadius.md};
              padding: 0.5rem 1rem;
              transition: all 0.2s;
            }
            .input-brand:focus {
              border-color: ${theme.colors.primary};
              outline: none;
              box-shadow: 0 0 0 3px ${theme.colors.primary}20;
            }

            /* Brand Card Styles */
            .card-brand {
              background: ${theme.colors.white};
              border-radius: ${theme.borderRadius.lg};
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              transition: all 0.2s;
            }
            .card-brand:hover {
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
          `}
        </style>
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              <SupabaseProvider session={session}>
                <ToastProvider>
                  <Providers>
                    {children}
                    <Toaster />
                  </Providers>
                </ToastProvider>
              </SupabaseProvider>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

