'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/index'
import Link from 'next/link'

const ANALYTICS_COOKIE = 'solis_consent_analytics'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string, days = 180) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; Expires=${expires}; Path=/; SameSite=Lax`
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const existing = getCookie(ANALYTICS_COOKIE)
    setVisible(existing === null)
  }, [])

  const accept = () => {
    setCookie(ANALYTICS_COOKIE, '1')
    try {
      window.dispatchEvent(new Event('solis-consent-analytics-granted'))
    } catch {}
    setVisible(false)
  }

  const decline = () => {
    setCookie(ANALYTICS_COOKIE, '0')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={cn('fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl rounded-md border bg-background p-4 shadow-lg')}
      role="dialog" aria-live="polite" aria-label="Slapukų sutikimas">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Naudojame analizės cookies, kad pagerintume biblioteką. Ar sutinkate?{' '}
          <Link
            href="https://www.soliopamoka.lt/store-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Daugiau
          </Link>
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={decline}>Atmesti</Button>
          <Button onClick={accept}>Leisti</Button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsentBanner


