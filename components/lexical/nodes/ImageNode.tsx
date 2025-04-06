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
import { createContext, useContext, useEffect, useRef, useState } from 'react';

export type ImagePayload = {
  altText: string;
  caption?: string;
  src: string;
  width?: number;
  height?: number;
};

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption?: string;
    src: string;
    width?: number;
    height?: number;
    type: 'image';
    version: 1;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __caption?: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__caption,
      node.__key
    );
  }

  constructor(src: string, altText: string, width?: number, height?: number, caption?: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__caption = caption;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'editor-image';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, caption, src, width, height } = serializedNode;
    const node = new ImageNode(src, altText, width, height, caption);
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      caption: this.__caption,
      src: this.__src,
      width: this.__width,
      height: this.__height,
      type: 'image',
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) {
      element.setAttribute('width', this.__width.toString());
    }
    if (this.__height) {
      element.setAttribute('height', this.__height.toString());
    }
    return { element };
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return <ImageComponent
      src={this.__src}
      altText={this.__altText}
      width={this.__width}
      height={this.__height}
      caption={this.__caption}
      nodeKey={this.getKey()}
    />;
  }
}

type ImageComponentProps = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  caption?: string;
  nodeKey: string;
};

function ImageComponent({
  src,
  altText,
  width,
  height,
  caption,
  nodeKey,
}: ImageComponentProps): JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected] = useState(false);
  
  useEffect(() => {
    // Handle selection logic here if needed
    return () => {
      // Cleanup
    };
  }, [nodeKey]);

  return (
    <div className="editor-image" draggable="true">
      <div className="image-container">
        <img
          src={src}
          alt={altText}
          ref={imageRef}
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
            maxWidth: '100%',
          }}
          draggable="false"
        />
      </div>
      {caption && <figcaption className="image-caption">{caption}</figcaption>}
    </div>
  );
}