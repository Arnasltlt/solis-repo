import { useState, useMemo, useCallback } from 'react'
import { getEmbedUrl } from '@/lib/utils/get-embed-url'

export function useVideoEmbed(videoUrl?: string) {
  const [videoLoaded, setVideoLoaded] = useState(false)

  const embedUrl = useMemo(() => getEmbedUrl(videoUrl || ''), [videoUrl])

  const handleLoad = useCallback(() => setVideoLoaded(true), [])

  return { embedUrl, videoLoaded, handleLoad }
}
