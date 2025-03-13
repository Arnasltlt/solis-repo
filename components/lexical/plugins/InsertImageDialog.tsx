'use client';

import React, { useState } from 'react';
import { LexicalEditor } from 'lexical';
import { INSERT_IMAGE_COMMAND } from './ToolbarPlugin';
import { uploadEditorImage } from '@/lib/services/storage';

export function InsertImageDialog({
  onClose,
  editor,
}: {
  onClose: () => void;
  editor: LexicalEditor;
}): JSX.Element {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlInsert = () => {
    if (!src) {
      setError('Please enter an image URL');
      return;
    }
    
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
      src,
      altText,
    });
    
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      return;
    }
    
    const selectedFile = files[0];
    
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      const result = await uploadEditorImage(file);
      
      if (result.error) {
        throw result.error;
      }
      
      if (!result.url) {
        throw new Error('Failed to get upload URL');
      }
      
      // Insert the image into the editor
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: result.url,
        altText: altText || file.name,
      });
      
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="insert-image-dialog">
      <div className="dialog-overlay" onClick={onClose}></div>
      <div className="dialog-content">
        <h3>Insert Image</h3>
        
        <div className="dialog-section">
          <h4>Option 1: Insert from URL</h4>
          <div className="dialog-form">
            <div className="form-field">
              <label htmlFor="imageUrl">Image URL</label>
              <input
                id="imageUrl"
                type="text"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="altText">Alt Text</label>
              <input
                id="altText"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive text for the image"
              />
            </div>
            
            <button onClick={handleUrlInsert} disabled={!src}>
              Insert from URL
            </button>
          </div>
        </div>
        
        <div className="dialog-divider"></div>
        
        <div className="dialog-section">
          <h4>Option 2: Upload an Image</h4>
          <div className="dialog-form">
            <div className="form-field">
              <label htmlFor="fileUpload">Select Image</label>
              <input
                id="fileUpload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            {file && (
              <div className="file-preview">
                <p>Selected file: {file.name}</p>
              </div>
            )}
            
            <button 
              onClick={handleFileUpload} 
              disabled={!file || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload and Insert'}
            </button>
          </div>
        </div>
        
        {error && <div className="dialog-error">{error}</div>}
        
        <div className="dialog-actions">
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
      
      <style jsx>{`
        .insert-image-dialog {
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
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .dialog-section {
          margin-bottom: 20px;
        }
        
        .dialog-divider {
          margin: 20px 0;
          border-top: 1px solid #eee;
        }
        
        .dialog-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-field label {
          font-weight: 500;
        }
        
        .form-field input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        
        .dialog-error {
          color: #d32f2f;
          margin-top: 10px;
          padding: 8px;
          background-color: #ffebee;
          border-radius: 4px;
        }
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background-color: #1976d2;
          color: white;
          cursor: pointer;
          font-weight: 500;
        }
        
        button:hover {
          background-color: #1565c0;
        }
        
        button:disabled {
          background-color: #bbdefb;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}