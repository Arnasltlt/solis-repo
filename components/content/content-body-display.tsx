'use client'

/**
 * @fileoverview This component is responsible for intelligently rendering the main body of content.
 * It supports both the new TipTap JSON format and a legacy raw HTML format, ensuring
 * backwards compatibility with older content.
 */

import React from 'react';
import { TipTapRenderer } from './tiptap-renderer';

/**
 * Sanitizes legacy HTML by converting YouTube watch URLs to embed URLs within iframes.
 * This is necessary to prevent "X-Frame-Options" errors.
 * @param {string} html - The raw HTML string.
 * @returns {string} The sanitized HTML string.
 */
const sanitizeLegacyHtml = (html: string): string => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
  const youtuBeRegex = /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/;

  const replacer = (src: string | null): string => {
    if (!src) return '';
    
    let match = src.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    match = src.match(youtuBeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    return src;
  };
  
  // A simple and safe way to parse and modify the HTML string without a full DOM parser.
  // This is safe because we are only replacing the src attribute on iframe tags.
  const modifiedHtml = html.replace(/<iframe[^>]*src="([^"]*)"[^>]*>/g, (iframeTag, src) => {
    const newSrc = replacer(src);
    return iframeTag.replace(src, newSrc);
  });

  return modifiedHtml;
};

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
  let jsonHasSubstantialContent = false;

  // Priority 1: Attempt to render modern TipTap JSON content.
  if (contentBody) {
    let parsedContent;
    try {
      if (typeof contentBody === 'string') {
        if (contentBody.trim().startsWith('{')) {
          parsedContent = JSON.parse(contentBody);
        }
      } else if (typeof contentBody === 'object') {
        parsedContent = contentBody;
      }

      // Check if the parsed content is more than just an empty paragraph.
      // This helps decide if we should fallback to legacy HTML.
      if (parsedContent && parsedContent.content) {
        // Check for any node that is not a simple, empty paragraph.
        jsonHasSubstantialContent = parsedContent.content.some(
          (node: any) =>
            node.type !== 'paragraph' ||
            (node.content && node.content.length > 0)
        );
      }

      if (parsedContent && jsonHasSubstantialContent) {
        return <TipTapRenderer jsonContent={parsedContent} />;
      }
    } catch (error) {
      console.warn("Failed to parse content_body as JSON, will check for legacy HTML.", error);
    }
  }

  // Priority 2: Fallback to legacy raw HTML if it exists and JSON is not substantial.
  if (contentBodyHtml && typeof contentBodyHtml === 'string' && contentBodyHtml.trim() !== '') {
    const sanitizedHtml = sanitizeLegacyHtml(contentBodyHtml);
    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Fallback: If no valid content is available, render nothing.
  return null;
} 