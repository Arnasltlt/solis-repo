
export const getEmbedUrl = (url: string): string => {
  if (!url) return '';

  try {
    const urlObject = new URL(url);
    
    if (urlObject.hostname.includes('youtube.com') || urlObject.hostname.includes('youtu.be')) {
      const videoId = urlObject.searchParams.get('v') || urlObject.pathname.split('/').pop();
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (urlObject.hostname.includes('vimeo.com')) {
      const videoId = urlObject.pathname.split('/').pop();
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
  } catch (error) {
    // Fallback for invalid URLs or different structures
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/i);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
  }

  return url;
};
