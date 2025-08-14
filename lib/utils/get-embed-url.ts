export function getEmbedUrl(url: string) {
  if (!url) return ''
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/i)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }
  return url
}
