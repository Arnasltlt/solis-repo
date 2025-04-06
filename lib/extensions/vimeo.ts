import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vimeo: {
      setVimeoVideo: (options: { src: string }) => ReturnType
    }
  }
}

export interface VimeoOptions {
  HTMLAttributes: Record<string, any>
  width?: number
  height?: number
}

export const Vimeo = Node.create<VimeoOptions>({
  name: 'vimeo',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      width: 840,
      height: 472,
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => {
          const src = element.getAttribute('src')
          if (!src) return null

          // Extract Vimeo ID from various URL formats
          const patterns = [
            /vimeo\.com\/(\d+)/,
            /vimeo\.com\/channels\/[^/]+\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/
          ]

          for (const pattern of patterns) {
            const match = src.match(pattern)
            if (match) return match[1]
          }

          return src
        },
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
        tag: 'iframe[src*="vimeo.com"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = `https://player.vimeo.com/video/${HTMLAttributes.src}`

    return ['div', { class: this.options.HTMLAttributes.class }, [
      'iframe',
      mergeAttributes(
        {
          width: this.options.width,
          height: this.options.height,
          src: embedUrl,
          frameborder: '0',
          allow: 'autoplay; fullscreen; picture-in-picture',
          allowfullscreen: true,
        },
        HTMLAttributes
      ),
    ]]
  },

  addCommands() {
    return {
      setVimeoVideo:
        (options) =>
        ({ commands }) => {
          const patterns = [
            /vimeo\.com\/(\d+)/,
            /vimeo\.com\/channels\/[^/]+\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/
          ]

          let videoId = null
          for (const pattern of patterns) {
            const match = options.src.match(pattern)
            if (match) {
              videoId = match[1]
              break
            }
          }

          if (!videoId) {
            throw new Error('Invalid Vimeo URL')
          }

          return commands.insertContent({
            type: this.name,
            attrs: { src: videoId },
          })
        },
    }
  },
}) 