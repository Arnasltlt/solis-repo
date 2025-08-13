// A simple Node extension for YouTube videos
import { Node, mergeAttributes } from '@tiptap/core'

export interface YoutubeBlockOptions {
  addPasteHandler: boolean,
  HTMLAttributes: Record<string, any>,
  defaultHeight?: number,
  defaultWidth?: number,
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
      defaultHeight: 400,
      defaultWidth: 640,
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
    
    // Create HTML structure with an actual iframe for the YouTube Block (no extra caption/button)
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-youtube-block': '',
        'class': 'youtube-block',
        'data-video-id': videoId,
      }),
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
        find: /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})(?:\S*)?/g,
        handler: ({ match, chain, editor, range }: any) => {
          const videoId = match[1] // Extract the ID from the URL
          if (videoId) {
            // Replace the pasted URL with the YouTube block (no leftover link text)
            editor
              .chain()
              .focus()
              .insertContentAt(range, {
                type: this.name,
                attrs: {
                  videoId,
                  src: match[0],
                },
              })
              .run()
          }
          // Return void instead of boolean
        },
      },
    ]
  },
})