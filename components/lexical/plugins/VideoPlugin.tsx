'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

// Simplified placeholder plugin
export function VideoPlugin(): JSX.Element | null {
  // No UI needed for this plugin, just the command listener
  return null;
}