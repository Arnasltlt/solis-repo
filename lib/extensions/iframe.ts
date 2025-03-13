import { Node, mergeAttributes } from '@tiptap/core'

export interface IframeOptions {
  HTMLAttributes: {
    [key: string]: any
  },
  allowedDomains: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string }) => ReturnType,
    }
  }
}

// Helper function to validate iframe URLs
function isValidIframeSrc(src: string, allowedDomains: string[]): boolean {
  try {
    const url = new URL(src)
    return allowedDomains.some(domain => url.hostname.includes(domain))
  } catch (e) {
    return false
  }
}

export const Iframe = Node.create<IframeOptions>({
  name: 'iframe',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  isolating: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'w-full aspect-video rounded-lg my-4',
        frameborder: '0',
        allowfullscreen: true,
      },
      // Default allowed domains for iframe embedding
      allowedDomains: [
        'youtube.com', 
        'youtube-nocookie.com', 
        'youtu.be',
        'vimeo.com', 
        'player.vimeo.com',
        'loom.com',
        'wistia.com',
        'wistia.net'
      ],
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => {
          const src = element.getAttribute('src')
          // Validate src against allowed domains
          if (src && isValidIframeSrc(src, this.options.allowedDomains)) {
            return src
          }
          return null
        },
      },
      title: {
        default: 'Embedded content',
      }
    }
  },

  parseHTML() {
    return [{
      tag: 'iframe',
    }]
  },

  renderHTML({ HTMLAttributes }) {
    // Only render if src is valid
    if (!HTMLAttributes.src || !isValidIframeSrc(HTMLAttributes.src, this.options.allowedDomains)) {
      return ['div', { class: 'invalid-iframe-placeholder' }, 'Invalid embed source']
    }

    return ['div', { class: 'relative my-4 cursor-pointer select-none' }, [
      'iframe', mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 
          contenteditable: 'false',
          loading: 'lazy', // Add lazy loading for better performance
          title: HTMLAttributes.title || 'Embedded content' // Add title for accessibility
        }
      ),
      ['p', { class: 'h-0 m-0 p-0 opacity-0' }, ' ']
    ]]
  },

  addCommands() {
    return {
      setIframe: options => ({ commands, chain }) => {
        // Validate src before inserting
        if (!options.src || !isValidIframeSrc(options.src, this.options.allowedDomains)) {
          console.warn('Invalid iframe source:', options.src)
          return false
        }

        return chain()
          .insertContent({
            type: this.name,
            attrs: options
          })
          .insertContent({
            type: 'paragraph',
            content: [{ type: 'text', text: '' }]
          })
          .focus()
          .run()
      },
    }
  },
}) 