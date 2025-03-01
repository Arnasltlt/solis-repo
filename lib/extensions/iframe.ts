import { Node, mergeAttributes } from '@tiptap/core'

export interface IframeOptions {
  HTMLAttributes: {
    [key: string]: any
  },
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string }) => ReturnType,
    }
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
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{
      tag: 'iframe',
    }]
  },

  renderHTML({ HTMLAttributes }) {
    // Create a wrapper div to help with selection and editing
    return ['div', { class: 'relative my-4 cursor-pointer select-none' }, [
      'iframe', mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { contenteditable: 'false' }
      ),
      // Add an invisible paragraph after the iframe to ensure cursor can move below
      ['p', { class: 'h-0 m-0 p-0 opacity-0' }, ' ']
    ]]
  },

  addCommands() {
    return {
      setIframe: options => ({ commands, chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: options
          })
          // Insert a paragraph after the iframe
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