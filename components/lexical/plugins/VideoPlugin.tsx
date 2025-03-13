'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createVideoNode, VideoNode } from '../nodes/VideoNode';
import { INSERT_VIDEO_COMMAND } from './ToolbarPlugin';

export function VideoPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([VideoNode])) {
      throw new Error('VideoPlugin: VideoNode not registered on editor');
    }

    return editor.registerCommand(
      INSERT_VIDEO_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        
        const { src, videoType, width, height, caption } = payload;
        const videoNode = $createVideoNode(src, videoType, width, height, caption);
        
        selection.insertNodes([videoNode]);
        
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

export function $createVideoNode(
  src: string,
  videoType: 'youtube' | 'vimeo' | 'iframe',
  width?: number,
  height?: number,
  caption?: string
): VideoNode {
  return new VideoNode(src, videoType, width, height, caption);
}