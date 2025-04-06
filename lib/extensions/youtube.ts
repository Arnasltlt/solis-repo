'use client'

import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: { videoId: string, width?: number, height?: number }) => ReturnType,
    }
  }
}

export interface YoutubeOptions {
  inline: boolean
  HTMLAttributes: Record<string, any>,
  width: number,
  height: number,
}

export const Youtube = Node.create<YoutubeOptions>({
  name: 'youtube',
  group: 'block',
  atom: true,
  
  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
      width: 640,
      height: 360,
    }
  },
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      videoId: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes.videoId
    
    if (!videoId) {
      return ['div', { class: 'youtube-error' }, 'Invalid YouTube video ID']
    }
    
    // Build the embed URL with proper parameters and without using youtube-nocookie
    // Some environments may block youtube-nocookie.com
    // Safe for SSR
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const embedUrl = `https://www.youtube.com/embed/${videoId}?showinfo=0&controls=1&modestbranding=1&origin=${encodeURIComponent(origin)}`
    
    return [
      'div', 
      { 
        'data-youtube-video': '',
        class: 'youtube-embed-wrapper my-4 w-full' 
      }, 
      ['iframe', mergeAttributes(
        {
          width: this.options.width,
          height: this.options.height,
          src: embedUrl,
          class: 'w-full aspect-video rounded-md',
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
        },
        HTMLAttributes
      )],
    ]
  },
  
  addCommands() {
    return {
      setYoutubeVideo: options => ({ commands }) => {
        if (!options.videoId) {
          console.error('No YouTube video ID provided')
          return false
        }
        
        // Insert the YouTube embed
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})