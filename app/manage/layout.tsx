import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Administravimas | Solis',
  description: 'Solis platformos administravimo skydelis',
}

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Grįžti į pagrindinį
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Solis administravimas</h1>
          </div>
          <nav>
            <ul className="flex gap-4">
              <li>
                <Link href="/manage" className="text-sm font-medium hover:text-primary">
                  Pagrindinis
                </Link>
              </li>
              <li>
                <Link href="/manage/categories" className="text-sm font-medium hover:text-primary">
                  Kategorijos
                </Link>
              </li>
              <li>
                <Link href="/manage/content" className="text-sm font-medium hover:text-primary">
                  Turinys
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      {children}
    </div>
  )
} 