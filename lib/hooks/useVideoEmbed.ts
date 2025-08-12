
import { useState, useMemo } from 'react';
import { getEmbedUrl } from '@/lib/utils/video';

export const useVideoEmbed = (videoUrl?: string | null) => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  const embedUrl = useMemo(() => {
    if (!videoUrl) return '';
    return getEmbedUrl(videoUrl);
  }, [videoUrl]);

  return {
    videoLoaded,
    setVideoLoaded,
    embedUrl,
  };
};
