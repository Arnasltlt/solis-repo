import './globals.css'
import { AuthProvider } from '@/lib/context/auth'
import { Toaster } from 'react-hot-toast'
import { theme } from '@/styles/theme'

export const metadata = {
  title: 'Solis - Vaikų ugdymo platforma',
  description: 'Šokio, muzikos ir kultūros ugdymo platforma vaikams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="lt">
      <head>
        <style>
          {`
            body {
              font-family: ${theme.fonts.base};
              background-color: ${theme.colors.gray[50]};
              color: ${theme.colors.black};
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
      <body>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: theme.colors.black,
                color: theme.colors.white,
                borderRadius: theme.borderRadius.md,
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

