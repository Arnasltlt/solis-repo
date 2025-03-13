// A simple Node extension for YouTube videos
import { Node, mergeAttributes } from '@tiptap/core'

export interface YoutubeBlockOptions {
  addPasteHandler: boolean,
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtubeBlock: {
      insertYoutubeBlock: (options: { src: string, videoId: string }) => ReturnType,
    }
  }
}

export const YoutubeBlock = Node.create<YoutubeBlockOptions>({
  name: 'youtubeBlock',
  group: 'block',
  content: '',
  marks: '',
  defining: true,
  
  addOptions() {
    return {
      addPasteHandler: true,
      HTMLAttributes: {},
    }
  },
  
  addAttributes() {
    return {
      videoId: {
        default: null,
      },
      src: {
        default: null,
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-block]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes.videoId
    
    if (!videoId) {
      return ['div', { class: 'youtube-error' }, 'Invalid YouTube video ID']
    }
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
    const videoLink = `https://www.youtube.com/watch?v=${videoId}`
    
    // Create HTML structure with an actual iframe for the YouTube Block
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-youtube-block': '',
        'class': 'youtube-block',
        'data-video-id': videoId,
      }),
      // Add an iframe container with proper responsive design
      ['div', { class: 'youtube-container' },
        [
          'iframe',
          {
            src: embedUrl,
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'true',
            width: '100%',
            height: '100%',
            style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;'
          }
        ]
      ],
      ['div', { class: 'youtube-caption' }, 
        ['a', 
          { 
            href: videoLink,
            target: '_blank',
            rel: 'noopener noreferrer' 
          }, 
          `Watch on YouTube`
        ]
      ]
    ]
  },
  
  addCommands() {
    return {
      insertYoutubeBlock: options => ({ commands, chain, editor }) => {
        // First ensure we're at a valid position for a block node
        const { selection } = editor.state
        
        // Insert the video at the current cursor position
        return chain()
          .insertContent({
            type: this.name,
            attrs: options
          })
          // Add a paragraph after the video for better editing experience
          .insertContent({ type: 'paragraph' })
          .run()
      },
    }
  },
  
  // Add paste handler to automatically convert YouTube URLs to embeds
  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return []
    }

    return [
      {
        // Match common YouTube URL formats
        find: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)/g,
        handler: ({ match, chain, editor }) => {
          const videoId = match[1]
          const src = match[0]
          
          if (videoId) {
            // Insert at current position
            chain()
              .insertContent({
                type: this.name,
                attrs: {
                  videoId,
                  src,
                },
              })
              // Add a paragraph after the video for better editing
              .insertContent({ type: 'paragraph' })
              .run()
              
            return true
          }
          
          return false
        },
      },
    ]
  },
})