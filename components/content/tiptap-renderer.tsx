/**
 * @fileoverview This file contains the TipTapRenderer, a React component designed to safely
 * render TipTap's JSON output into a tree of React components. This approach avoids the
 * use of `dangerouslySetInnerHTML` and allows for custom rendering of specific node types,
 * such as Instagram embeds.
 */

import React from 'react';
import { InstagramEmbed } from './instagram-embed';

/**
 * Extracts a YouTube video ID from various URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string | null} The video ID or null if not found.
 */
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  // This regex handles youtube.com/watch, youtu.be/, youtube.com/embed/, and youtube.com/shorts/
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Recursively renders a TipTap node and its children.
 * @param {any} node - The TipTap node object to render.
 * @param {number} index - The key for the React element.
 * @returns {JSX.Element | string | null} The rendered React element, text, or null.
 */
const renderNode = (node: any, index: number): JSX.Element | string | null => {
  // Handle text nodes, applying marks (bold, italic, etc.)
  if (node.type === 'text') {
    let textElement: React.ReactNode = node.text;
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case 'bold':
            textElement = <strong>{textElement}</strong>;
            break;
          case 'italic':
            textElement = <em>{textElement}</em>;
            break;
          case 'link':
            textElement = <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">{textElement}</a>;
            break;
          // Add other mark types as needed
        }
      }
    }
    return <React.Fragment key={index}>{textElement}</React.Fragment>;
  }

  // Handle element nodes by mapping their type to a React component
  const children = node.content ? node.content.map(renderNode) : [];

  switch (node.type) {
    case 'paragraph':
      return <p key={index}>{children}</p>;
    case 'heading':
      const Tag = `h${node.attrs.level}` as keyof JSX.IntrinsicElements;
      return <Tag key={index}>{children}</Tag>;
    case 'bulletList':
      return <ul key={index}>{children}</ul>;
    case 'orderedList':
      return <ol key={index}>{children}</ol>;
    case 'listItem':
      return <li key={index}>{children}</li>;
    case 'blockquote':
      return <blockquote key={index}>{children}</blockquote>;
    
    // Custom node for YouTube iframes
    case 'youtube':
      // Robustly get the video ID from either `videoId` or `src` attribute.
      const videoId = node.attrs.videoId || getYouTubeId(node.attrs.src);
      
      if (!videoId) {
        // If no valid ID can be found, render nothing to avoid a broken iframe.
        console.warn('Could not extract YouTube video ID from node:', node.attrs);
        return null;
      }
      
      const videoSrc = `https://www.youtube.com/embed/${videoId}`;

      return (
        <div key={index} className="aspect-video my-6">
          <iframe
            src={videoSrc}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );

    // Custom node for Instagram embeds, using the dedicated component
    case 'instagramBlock':
      return (
        <div key={index} className="not-prose">
          <InstagramEmbed src={node.attrs.src} />
        </div>
      );

    // Image node rendering
    case 'image': {
      const { src, alt, title } = node.attrs || {};
      let { width } = node.attrs || {};
      if (!src) return null;
      const style: React.CSSProperties = {};
      // Default to 320px if width is missing
      width = width || '320px';
      style.width = width as any;
      style.height = 'auto';
      return (
        <img
          key={index}
          src={src}
          alt={alt || ''}
          title={title || undefined}
          style={style}
          className="max-w-full h-auto rounded-md my-4"
          loading="lazy"
        />
      );
    }
    
    // Default case for unknown node types
    default:
      // In a production environment, you might want to log this or render nothing.
      return <div key={index}>{children}</div>;
  }
};

/**
 * Renders a TipTap JSON document into a tree of React components.
 * @param {object} props - The component's properties.
 * @param {object} props.jsonContent - The TipTap JSON document object.
 * @returns {JSX.Element} The rendered React elements.
 */
export const TipTapRenderer = ({ jsonContent }: { jsonContent: any }) => {
  if (!jsonContent || !jsonContent.content) {
    return null;
  }

  return (
    <div className="prose max-w-none">
      {jsonContent.content.map(renderNode)}
    </div>
  );
};
