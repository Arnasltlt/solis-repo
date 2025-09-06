'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

interface PageHeaderProps {
  title: string
  backUrl?: string
  showLogo?: boolean
}

/**
 * PageHeader - Consistent header component for pages
 * 
 * This component provides:
 * - Logo
 * - Page title
 * - Back button to return to previous page
 */
export function PageHeader({ title, backUrl, showLogo = true }: PageHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showLogo && <Logo size="medium" />}
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
          </div>
          {backUrl && (
            <Button
              onClick={() => router.push(backUrl)}
              variant="outline"
            >
              ← Grįžti
            </Button>
          )}
        </div>
      </div>
    </header>
  )
} 