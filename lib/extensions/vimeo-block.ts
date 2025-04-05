// A simple Node extension for Vimeo videos
import { Node, mergeAttributes } from '@tiptap/core'

export interface VimeoBlockOptions {
  addPasteHandler: boolean,
  HTMLAttributes: Record<string, any>,
  defaultHeight?: number,
  defaultWidth?: number,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vimeoBlock: {
      insertVimeoBlock: (options: { src: string, videoId: string }) => ReturnType,
    }
  }
}

export const VimeoBlock = Node.create<VimeoBlockOptions>({
  name: 'vimeoBlock',
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
        tag: 'div[data-vimeo-block]',
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    const videoId = HTMLAttributes.videoId
    
    if (!videoId) {
      return ['div', { class: 'vimeo-error' }, 'Invalid Vimeo video ID']
    }
    
    const embedUrl = `https://player.vimeo.com/video/${videoId}?dnt=1`
    const videoLink = `https://vimeo.com/${videoId}`
    
    // Create HTML structure with an iframe for the Vimeo Block
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-vimeo-block': '',
        'class': 'vimeo-block',
        'data-video-id': videoId,
      }),
      // Add an iframe container with proper responsive design
      ['div', { class: 'vimeo-container' },
        [
          'iframe',
          {
            src: embedUrl,
            frameborder: '0',
            allow: 'autoplay; fullscreen; picture-in-picture',
            allowfullscreen: 'true',
            width: '100%',
            height: '100%',
            style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;'
          }
        ]
      ],
      ['div', { class: 'vimeo-caption' }, 
        ['a', 
          { 
            href: videoLink,
            target: '_blank',
            rel: 'noopener noreferrer' 
          }, 
          `Watch on Vimeo`
        ]
      ]
    ]
  },
  
  addCommands() {
    return {
      insertVimeoBlock: options => ({ commands, chain, editor }) => {
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
  
  // Add paste handler to automatically convert Vimeo URLs to embeds
  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return []
    }

    return [
      {
        find: /https?:\/\/(www\.)?vimeo\.com\/(\d+)(?:\?.*)?/g,
        handler: ({ match, chain, editor }: any) => {
          const videoId = match[2] // Extract the ID from the URL
          if (videoId) {
            chain().insertContent({
              type: this.name,
              attrs: {
                videoId,
                src: match[0],
              },
            }).run()
          }
          // Return void instead of boolean
        },
      },
    ]
  },
})