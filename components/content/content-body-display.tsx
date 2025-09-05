'use client'

/**
 * @fileoverview This component is responsible for intelligently rendering the main body of content.
 * It supports both the new TipTap JSON format and a legacy raw HTML format, ensuring
 * backwards compatibility with older content.
 */

import React from 'react';
import { TipTapRenderer } from './tiptap-renderer';

/**
 * Defines the props for the ContentBodyDisplay component.
 */
interface ContentBodyDisplayProps {
  /** The TipTap content, which can be a JSON string or a pre-parsed object. This is the preferred format. */
  contentBody: string | object | null | undefined;
  /** Optional raw HTML content for backwards compatibility with legacy data. */
  contentBodyHtml?: string | null | undefined;
}

/**
 * Renders content by prioritizing the modern TipTap JSON format and falling back to a
 * legacy raw HTML format if necessary.
 *
 * @rendering_priority
 * 1. It first attempts to parse and render `contentBody` as TipTap JSON.
 * 2. If `contentBody` is absent or invalid, it falls back to rendering `contentBodyHtml`.
 * 3. If neither is available, it renders nothing.
 *
 * The use of `dangerouslySetInnerHTML` is intentional and scoped only to the legacy
 * `contentBodyHtml` field to maintain compatibility with old data.
 */
export function ContentBodyDisplay({ contentBody, contentBodyHtml }: ContentBodyDisplayProps) {
  // Priority 1: Attempt to render modern TipTap JSON content.
  if (contentBody) {
    let parsedContent;
    try {
      if (typeof contentBody === 'string') {
        // Attempt to parse if it's a non-empty string that looks like JSON.
        if (contentBody.trim().startsWith('{')) {
          parsedContent = JSON.parse(contentBody);
        }
      } else if (typeof contentBody === 'object') {
        parsedContent = contentBody;
      }

      // If parsing was successful and we have a valid object, render it.
      if (parsedContent && typeof parsedContent === 'object') {
        return <TipTapRenderer jsonContent={parsedContent} />;
      }
    } catch (error) {
      // If JSON parsing fails, we'll fall through to the legacy HTML check.
      console.warn("Failed to parse content_body as JSON, will check for legacy HTML.", error);
    }
  }

  // Priority 2: Fallback to legacy raw HTML content.
  if (contentBodyHtml && typeof contentBodyHtml === 'string' && contentBodyHtml.trim() !== '') {
    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: contentBodyHtml }}
      />
    );
  }

  // Fallback: If no valid content is available, render nothing.
  return null;
} 