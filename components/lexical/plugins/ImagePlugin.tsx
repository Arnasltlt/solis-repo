'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createImageNode, ImageNode } from '../nodes/ImageNode';
import { INSERT_IMAGE_COMMAND } from './ToolbarPlugin';

export function ImagePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagePlugin: ImageNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        
        const { src, altText, width, height, caption } = payload;
        const imageNode = $createImageNode(src, altText, width, height, caption);
        
        selection.insertNodes([imageNode]);
        
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

export function $createImageNode(
  src: string,
  altText: string,
  width?: number,
  height?: number,
  caption?: string
): ImageNode {
  return new ImageNode(src, altText, width, height, caption);
}