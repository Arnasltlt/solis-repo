'use client'

import React, { useState } from 'react'
import { DocumentIcon } from '@heroicons/react/24/solid'

// Allow common document formats plus audio files
const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.zip,audio/*'

export type SimpleAttachment = {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
}

interface SimpleAttachmentUploaderProps {
  onAttachmentsChange: (attachments: SimpleAttachment[]) => void;
  initialAttachments?: SimpleAttachment[];
}

export function SimpleAttachmentUploader({
  onAttachmentsChange,
  initialAttachments = []
}: SimpleAttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<SimpleAttachment[]>(initialAttachments)
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    
    setIsUploading(true)
    
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        
        // Create a fake attachment for testing
        const newAttachment: SimpleAttachment = {
          id: Date.now().toString() + i,
          url: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size
        }
        
        setAttachments(prev => {
          const updated = [...prev, newAttachment]
          // Defer notifying parent to avoid setState during render warnings
          queueMicrotask(() => onAttachmentsChange(updated))
          return updated
        })
      }
    } finally {
      setIsUploading(false)
    }
  }
  
  return (
    <div className="border-2 border-dashed rounded-lg p-6">
      <div className="text-center">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label className="cursor-pointer text-blue-500">
            <span>Įkelti priedus</span>
            <input
              type="file"
              className="sr-only"
              accept={ACCEPTED_FILE_TYPES}
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
          <p className="text-sm text-gray-500 mt-1">PDF, DOC, XLS, ZIP, MP3, WAV ir kiti formatai</p>
        </div>
        
        {isUploading && <p className="mt-2">Įkeliama...</p>}
        
        {attachments.length > 0 && (
          <div className="mt-4 text-left">
            <h4 className="font-medium">Pridėti failai:</h4>
            <ul className="mt-2 space-y-1">
              {attachments.map(file => (
                <li key={file.id} className="text-sm">
                  {file.fileName} ({(file.fileSize / 1024).toFixed(1)} KB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}