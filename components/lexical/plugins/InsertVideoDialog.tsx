'use client';

import React, { useState } from 'react';
import { LexicalEditor } from 'lexical';
import { INSERT_VIDEO_COMMAND } from './ToolbarPlugin';

export function InsertVideoDialog({
  onClose,
  editor,
}: {
  onClose: () => void;
  editor: LexicalEditor;
}): JSX.Element {
  const [src, setSrc] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'vimeo' | 'iframe'>('youtube');
  const [width, setWidth] = useState('560');
  const [height, setHeight] = useState('315');
  const [error, setError] = useState<string | null>(null);

  // Helper to detect video type from URL
  const detectVideoType = (url: string): 'youtube' | 'vimeo' | 'iframe' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    return 'iframe';
  };

  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSrc(url);
    
    // Auto-detect video type from URL
    if (url) {
      setVideoType(detectVideoType(url));
    }
  };

  const handleInsert = () => {
    if (!src) {
      setError('Please enter a video URL');
      return;
    }
    
    try {
      // Create the video node
      editor.dispatchCommand(INSERT_VIDEO_COMMAND, {
        src,
        videoType,
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Error inserting video:', error);
      setError(error instanceof Error ? error.message : 'Error inserting video');
    }
  };

  return (
    <div className="insert-video-dialog">
      <div className="dialog-overlay" onClick={onClose}></div>
      <div className="dialog-content">
        <h3>Insert Video</h3>
        
        <div className="dialog-form">
          <div className="form-field">
            <label htmlFor="videoUrl">Video URL</label>
            <input
              id="videoUrl"
              type="text"
              value={src}
              onChange={handleSrcChange}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="videoType">Video Type</label>
            <select
              id="videoType"
              value={videoType}
              onChange={(e) => setVideoType(e.target.value as 'youtube' | 'vimeo' | 'iframe')}
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="iframe">Other (Iframe)</option>
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="videoWidth">Width</label>
              <input
                id="videoWidth"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="560"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="videoHeight">Height</label>
              <input
                id="videoHeight"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="315"
              />
            </div>
          </div>
          
          {error && <div className="dialog-error">{error}</div>}
          
          <div className="dialog-actions">
            <button onClick={onClose} className="button-secondary">Cancel</button>
            <button onClick={handleInsert} disabled={!src} className="button-primary">
              Insert Video
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .insert-video-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .dialog-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        .dialog-content {
          position: relative;
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dialog-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-row {
          display: flex;
          gap: 10px;
        }
        
        .form-row .form-field {
          flex: 1;
        }
        
        .form-field label {
          font-weight: 500;
        }
        
        .form-field input,
        .form-field select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        
        .dialog-error {
          color: #d32f2f;
          padding: 8px;
          background-color: #ffebee;
          border-radius: 4px;
        }
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .button-primary {
          background-color: #1976d2;
          color: white;
        }
        
        .button-primary:hover {
          background-color: #1565c0;
        }
        
        .button-primary:disabled {
          background-color: #bbdefb;
          cursor: not-allowed;
        }
        
        .button-secondary {
          background-color: #f5f5f5;
          color: #333;
        }
        
        .button-secondary:hover {
          background-color: #e0e0e0;
        }
      `}</style>
    </div>
  );
}