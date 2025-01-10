'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Turinys nerastas
        </h2>
        <p className="text-gray-600 mb-6">
          Atsiprašome, bet ieškomas turinys neegzistuoja.
        </p>
        <Link href="/">
          <Button variant="outline">
            ← Grįžti į pradžią
          </Button>
        </Link>
      </div>
    </div>
  )
} 