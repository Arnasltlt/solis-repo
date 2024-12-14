import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}

