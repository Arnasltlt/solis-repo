/**
 * @fileoverview This file contains the React component for the InstagramBlock Tiptap extension's NodeView.
 *
 * @description
 * This component is responsible for rendering a non-functional, styled placeholder
 * for Instagram embeds within the TipTap editor. It provides a clear visual confirmation
 * to the user that the embed has been successfully inserted, without attempting to load
 * any external scripts, which is handled by the frontend renderer.
 */

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { InstagramLogoIcon } from '@radix-ui/react-icons'; // Using a readily available icon

/**
 * Renders a styled placeholder for an Instagram embed within the Tiptap editor.
 * @param {object} props - The properties for the component.
 * @param {any} props.node - The Tiptap node object, containing attributes like `src`.
 * @returns {JSX.Element} The rendered placeholder component.
 */
export const InstagramNodeView = ({ node }: { node: any }) => {
  // Log to the console every time a placeholder is rendered for easy troubleshooting.
  console.log('[InstagramNodeView] Rendering placeholder for:', node.attrs.src);

  return (
    <NodeViewWrapper>
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
        data-instagram-placeholder
        contentEditable={false}
      >
        <InstagramLogoIcon width="24" height="24" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#333' }}>
            Instagram Post
          </p>
          <a
            href={node.attrs.src}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#555',
              textDecoration: 'underline',
              wordBreak: 'break-all',
            }}
          >
            {node.attrs.src}
          </a>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
