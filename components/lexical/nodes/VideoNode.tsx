'use client';

import {
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';
import { useEffect, useRef, useState } from 'react';

export type VideoPayload = {
  src: string;
  videoType: 'youtube' | 'vimeo' | 'iframe';
  width?: number;
  height?: number;
  caption?: string;
};

export type SerializedVideoNode = Spread<
  {
    src: string;
    videoType: 'youtube' | 'vimeo' | 'iframe';
    width?: number;
    height?: number;
    caption?: string;
    type: 'video';
    version: 1;
  },
  SerializedLexicalNode
>;

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __videoType: 'youtube' | 'vimeo' | 'iframe';
  __width?: number;
  __height?: number;
  __caption?: string;

  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(
      node.__src,
      node.__videoType,
      node.__width,
      node.__height,
      node.__caption,
      node.__key
    );
  }

  constructor(
    src: string,
    videoType: 'youtube' | 'vimeo' | 'iframe',
    width?: number,
    height?: number,
    caption?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__videoType = videoType;
    this.__width = width;
    this.__height = height;
    this.__caption = caption;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'editor-video';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const { src, videoType, width, height, caption } = serializedNode;
    const node = new VideoNode(src, videoType, width, height, caption);
    return node;
  }

  exportJSON(): SerializedVideoNode {
    return {
      src: this.__src,
      videoType: this.__videoType,
      width: this.__width,
      height: this.__height,
      caption: this.__caption,
      type: 'video',
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'video-embed';
    
    let videoElement;
    
    if (this.__videoType === 'youtube') {
      videoElement = document.createElement('iframe');
      videoElement.setAttribute('src', this.__src);
      videoElement.setAttribute('frameborder', '0');
      videoElement.setAttribute('allowfullscreen', 'true');
    } else if (this.__videoType === 'vimeo') {
      videoElement = document.createElement('iframe');
      videoElement.setAttribute('src', this.__src);
      videoElement.setAttribute('frameborder', '0');
      videoElement.setAttribute('allowfullscreen', 'true');
    } else {
      videoElement = document.createElement('iframe');
      videoElement.setAttribute('src', this.__src);
      videoElement.setAttribute('frameborder', '0');
    }
    
    if (this.__width) {
      videoElement.setAttribute('width', this.__width.toString());
    }
    
    if (this.__height) {
      videoElement.setAttribute('height', this.__height.toString());
    }
    
    element.appendChild(videoElement);
    
    return { element };
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return <VideoComponent
      src={this.__src}
      videoType={this.__videoType}
      width={this.__width}
      height={this.__height}
      caption={this.__caption}
      nodeKey={this.getKey()}
    />;
  }
}

type VideoComponentProps = {
  src: string;
  videoType: 'youtube' | 'vimeo' | 'iframe';
  width?: number;
  height?: number;
  caption?: string;
  nodeKey: string;
};

function VideoComponent({
  src,
  videoType,
  width = 640,
  height = 320,
  caption,
  nodeKey,
}: VideoComponentProps): JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isSelected, setSelected] = useState(false);
  
  useEffect(() => {
    // Handle selection logic here if needed
    return () => {
      // Cleanup
    };
  }, [nodeKey]);

  const getEmbedUrl = (url: string, type: 'youtube' | 'vimeo' | 'iframe'): string => {
    if (type === 'youtube') {
      // Extract video ID from various YouTube URL formats
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(youtubeRegex);
      return match 
        ? `https://www.youtube.com/embed/${match[1]}?rel=0` 
        : url;
    } 
    
    if (type === 'vimeo') {
      // Extract video ID from Vimeo URL
      const vimeoRegex = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i;
      const match = url.match(vimeoRegex);
      return match 
        ? `https://player.vimeo.com/video/${match[1]}` 
        : url;
    }
    
    // For iframe, just return the URL as is
    return url;
  };

  const embedUrl = getEmbedUrl(src, videoType);

  return (
    <div className="editor-video" draggable="true">
      <div className="video-container">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          width={width}
          height={height}
          frameBorder="0"
          allowFullScreen
          style={{ maxWidth: '100%' }}
        />
      </div>
      {caption && <figcaption className="video-caption">{caption}</figcaption>}
    </div>
  );
}