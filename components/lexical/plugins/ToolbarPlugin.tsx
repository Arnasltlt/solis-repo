'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  createCommand, 
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { 
  $createHeadingNode,
  HeadingTagType 
} from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
import { 
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { InsertImageDialog } from './InsertImageDialog';
import { InsertVideoDialog } from './InsertVideoDialog';

export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  src: string;
  altText: string;
  width?: number;
  height?: number;
  caption?: string;
}> = createCommand('INSERT_IMAGE_COMMAND');

export const INSERT_VIDEO_COMMAND: LexicalCommand<{
  src: string;
  videoType: 'youtube' | 'vimeo' | 'iframe';
  width?: number;
  height?: number;
  caption?: string;
}> = createCommand('INSERT_VIDEO_COMMAND');

export function ToolbarPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [activeHeading, setActiveHeading] = useState<HeadingTagType | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  // Format text styles
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));

    // Check for headings
    const anchorNode = selection.anchor.getNode();
    const element = anchorNode.getKey() === 'root' 
      ? anchorNode 
      : anchorNode.getTopLevelElementOrThrow();
    
    const elementKey = element.getKey();
    const elementDOM = editor.getElementByKey(elementKey);

    if (elementDOM) {
      if (elementDOM.tagName === 'H1') {
        setActiveHeading('h1');
      } else if (elementDOM.tagName === 'H2') {
        setActiveHeading('h2');
      } else if (elementDOM.tagName === 'H3') {
        setActiveHeading('h3');
      } else {
        setActiveHeading(null);
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  // Buttons click handlers
  const formatHeading = (headingSize: HeadingTagType) => {
    if (activeHeading === headingSize) {
      // If already this heading, convert to paragraph
      editor.update(() => {
        $setBlocksType($getSelection(), () => $createParagraphNode());
      });
    } else {
      editor.update(() => {
        $setBlocksType($getSelection(), () => $createHeadingNode(headingSize));
      });
    }
  };

  return (
    <div className="toolbar">
      <button
        type="button"
        className={isBold ? 'active' : ''}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        title="Bold"
        aria-label="Format text as bold"
      >
        <i className="fas fa-bold" />B
      </button>
      <button
        type="button"
        className={isItalic ? 'active' : ''}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        title="Italic"
        aria-label="Format text as italics"
      >
        <i className="fas fa-italic" />I
      </button>
      <button
        type="button"
        className={isUnderline ? 'active' : ''}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        title="Underline"
        aria-label="Format text as underlined"
      >
        <i className="fas fa-underline" />U
      </button>
      
      <div className="divider" />
      
      <button
        type="button"
        className={activeHeading === 'h1' ? 'active' : ''}
        onClick={() => formatHeading('h1')}
        title="Heading 1"
        aria-label="Format as heading 1"
      >
        H1
      </button>
      <button
        type="button"
        className={activeHeading === 'h2' ? 'active' : ''}
        onClick={() => formatHeading('h2')}
        title="Heading 2"
        aria-label="Format as heading 2"
      >
        H2
      </button>
      <button
        type="button"
        className={activeHeading === 'h3' ? 'active' : ''}
        onClick={() => formatHeading('h3')}
        title="Heading 3"
        aria-label="Format as heading 3"
      >
        H3
      </button>
      
      <div className="divider" />
      
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        title="Bullet List"
        aria-label="Insert bullet list"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        title="Numbered List"
        aria-label="Insert numbered list"
      >
        1. List
      </button>
      
      <div className="divider" />
      
      <button
        type="button"
        onClick={() => setIsImageDialogOpen(true)}
        title="Insert Image"
        aria-label="Insert image"
      >
        Image
      </button>
      <button
        type="button"
        onClick={() => setIsVideoDialogOpen(true)}
        title="Insert Video"
        aria-label="Insert video"
      >
        Video
      </button>
      
      {isImageDialogOpen && (
        <InsertImageDialog
          onClose={() => setIsImageDialogOpen(false)}
          editor={editor}
        />
      )}
      
      {isVideoDialogOpen && (
        <InsertVideoDialog
          onClose={() => setIsVideoDialogOpen(false)}
          editor={editor}
        />
      )}
    </div>
  );
}