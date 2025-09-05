/**
 * @fileoverview This file contains the Tiptap extension for Instagram posts.
 *
 * @description
 * This node defines the schema for an Instagram embed within the Tiptap editor. It is designed
 * to be a simple, declarative placeholder. It stores the post URL and renders a basic div
 * with a data attribute.
 *
 * @implementation_notes
 * Crucially, this node does NOT use a React NodeView and does NOT attempt to load the Instagram
 * `embed.js` script. This is intentional. The complex rendering logic, including script loading,
 * is offloaded to the frontend `ContentBodyDisplay` component. This architecture avoids race
 * conditions with Tiptap's SSR and hydration in a Next.js environment, ensuring that the editor
 * remains fast and stable, while the final rendering is handled correctly in the display layer.
 */

import { Node, mergeAttributes, nodePasteRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { InstagramNodeView } from '@/components/editor/instagram-node-view'

/**
 * A robust regular expression for matching various Instagram URL formats.
 * The global flag (`g`) is required for the `nodePasteRule` to function correctly.
 */
const INSTAGRAM_REGEX_GLOBAL = /https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)\/?/g

export interface InstagramBlockOptions {
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    instagramBlock: {
      /**
       * Add an Instagram post embed
       */
      setInstagramPost: (options: { src: string }) => ReturnType,
    }
  }
}

export const InstagramBlock = Node.create<InstagramBlockOptions>({
  name: 'instagramBlock',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
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
    return [
      {
        tag: 'div[data-instagram-block]',
        getAttrs: dom => {
            const iframe = dom.querySelector('iframe')
            return { src: iframe?.getAttribute('src') }
        }
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // This is a simple placeholder for the saved HTML. The actual rendering is done by the NodeView.
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-instagram-block': '' })]
  },

  addCommands() {
    return {
      setInstagramPost: options => ({ commands }) => {
        console.log('[InstagramBlock] setInstagramPost command triggered with src:', options.src);
        if (!options.src) {
          return false
        }

        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addPasteRules() {
    return [
      nodePasteRule({
        find: INSTAGRAM_REGEX_GLOBAL,
        type: this.type,
        getAttributes: match => {
          console.log('[InstagramBlock] Paste rule matched via nodePasteRule:', match[0]);
          return { src: match[0] };
        },
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InstagramNodeView)
  },
})
