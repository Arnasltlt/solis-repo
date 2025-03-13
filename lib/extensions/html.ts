import { Node, mergeAttributes } from '@tiptap/core'

export interface HTMLOptions {
  HTMLAttributes: {
    [key: string]: any
  },
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    html: {
      setHTML: (options: { html: string }) => ReturnType,
    }
  }
}

export const HTML = Node.create<HTMLOptions>({
  name: 'html',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [
      { tag: 'div[data-html-block]' },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-html-block': '' }, HTMLAttributes), 0]
  },
  addCommands() {
    return {
      setHTML: options => ({ commands, chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: {
              'data-html': options.html,
            },
            content: [
              {
                type: 'text',
                text: options.html,
              },
            ],
          })
          .run()
      },
    }
  },
})