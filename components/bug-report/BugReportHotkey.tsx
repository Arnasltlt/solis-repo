'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthorization } from '@/hooks/useAuthorization'
import { useToast } from '@/components/ui/use-toast'

type ScreenshotResult = {
  dataUrl: string
  width: number
  height: number
}

function useCmdShiftB(onTrigger: () => void) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const metaPressed = isMac ? e.metaKey : e.ctrlKey
      if (metaPressed && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        onTrigger()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTrigger])
}

async function captureViewportScreenshot(): Promise<ScreenshotResult | null> {
  const html2canvas = (await import('html2canvas')).default
  const scale = Math.min(1, 1600 / window.innerWidth) // constrain size to keep payload small
  const canvas = await html2canvas(document.body, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
  })
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return { dataUrl, width: canvas.width, height: canvas.height }
}

async function uploadScreenshot(dataUrl: string): Promise<string | null> {
  try {
    const response = await fetch('/api/bug-report/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    })
    if (!response.ok) return null
    const json = await response.json()
    return json.url as string
  } catch {
    return null
  }
}

function buildMarkdownDescription(params: {
  comment: string
  screenshotUrl?: string | null
}): string {
  const { comment, screenshotUrl } = params
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const path = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
  const ua = navigator.userAgent
  const lang = navigator.language
  const platform = navigator.platform
  const viewport = `${window.innerWidth}x${window.innerHeight} (dpr ${window.devicePixelRatio})`
  const time = new Date().toISOString()
  const lines: string[] = []
  lines.push(comment.trim())
  lines.push('')
  lines.push('---')
  lines.push('Environment:')
  lines.push(`- URL: ${url}`)
  lines.push(`- Path: ${path}`)
  lines.push(`- Timestamp: ${time}`)
  lines.push(`- UA: ${ua}`)
  lines.push(`- Lang: ${lang}`)
  lines.push(`- Platform: ${platform}`)
  lines.push(`- Viewport: ${viewport}`)
  if (screenshotUrl) {
    lines.push('')
    lines.push('Screenshot:')
    lines.push(`${screenshotUrl}`)
    lines.push('')
    lines.push(`![screenshot](${screenshotUrl})`)
  }
  return lines.join('\n')
}

export function BugReportHotkey(): React.JSX.Element | null {
  const { isAdmin } = useAuthorization()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [comment, setComment] = React.useState('')
  const [includeScreenshot, setIncludeScreenshot] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  const trigger = React.useCallback(() => {
    if (!isAdmin()) return
    setOpen(true)
  }, [isAdmin])

  useCmdShiftB(trigger)

  if (!isAdmin()) return null

  const onSubmit = async () => {
    if (!comment.trim()) {
      toast({ title: 'Add a short description', description: 'Please write what needs to be fixed.' })
      return
    }
    setSubmitting(true)
    try {
      let screenshotUrl: string | null = null
      if (includeScreenshot) {
        const shot = await captureViewportScreenshot()
        if (shot?.dataUrl) {
          screenshotUrl = await uploadScreenshot(shot.dataUrl)
        }
      }

      const titleMax = 80
      const titleBase = `Bug report: ${window.location.pathname}`
      const title = (comment.trim().length > 0)
        ? `${titleBase} – ${comment.trim()}`.slice(0, titleMax)
        : titleBase
      const description = buildMarkdownDescription({ comment, screenshotUrl })

      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, body: description }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      toast({ title: 'Bug report sent', description: 'Thank you!' })
      setOpen(false)
      setComment('')
    } catch (err) {
      toast({ title: 'Failed to send bug report', description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a bug</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describe the issue (e.g., This needs to be black)"
            rows={5}
          />
          <div className="flex items-center space-x-2">
            <Checkbox id="include-shot" checked={includeScreenshot} onCheckedChange={(v) => setIncludeScreenshot(Boolean(v))} />
            <label htmlFor="include-shot" className="text-sm">Include screenshot of the page</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Sending…' : 'Submit'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BugReportHotkey


