'use client';

import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, EditorState } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { ImageNode } from './nodes/ImageNode';
import { ImagePlugin } from './plugins/ImagePlugin';
import { VideoNode } from './nodes/VideoNode';
import { VideoPlugin } from './plugins/VideoPlugin';

import './editor.css';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Custom error boundary component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lexical Editor error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-boundary">Something went wrong with the editor.</div>;
    }

    return this.props.children;
  }
}

// Theme for styling the editor
const theme = {
  // Theme styling goes here
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
  },
  image: 'editor-image',
  video: 'editor-video',
};

// Lexical nodes to register
const nodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  LinkNode,
  ImageNode,
  VideoNode,
];

// Function to save editor content
function onChange(editorState: EditorState) {
  editorState.read(() => {
    const root = $getRoot();
    const selection = $getSelection();
    
    // Save to localStorage or process as needed
    localStorage.setItem('editorContent', JSON.stringify(root.exportJSON()));
  });
}

export default function LexicalEditor({
  initialContent = null,
  onChange: onChangeProp,
}: {
  initialContent?: any;
  onChange?: (content: any) => void;
}) {
  // Editor configuration
  const editorConfig = {
    theme,
    nodes,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    namespace: 'SolisEditor',
    editorState: initialContent,
  };

  // Handle changes if parent needs the content
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const jsonContent = JSON.stringify($getRoot().exportJSON());
      onChangeProp?.(jsonContent);
    });
  };

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={editorConfig}>
        <div className="editor-inner">
          <ToolbarPlugin />
          <div className="editor-content">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<div className="editor-placeholder">Type something...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
            <LinkPlugin />
            <ImagePlugin />
            <VideoPlugin />
            {onChangeProp && <OnChangePlugin onChange={handleChange} />}
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}