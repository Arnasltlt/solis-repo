'use client'

import React, { useState, useRef } from 'react'
import { DocumentIcon, XMarkIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

export type AttachmentFile = {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface FileAttachmentsUploaderProps {
  onAttachmentsChange: (files: AttachmentFile[]) => void;
  initialAttachments?: AttachmentFile[];
  className?: string;
  label?: string;
  description?: string;
  maxFiles?: number;
}

export function FileAttachmentsUploader({
  onAttachmentsChange,
  initialAttachments = [],
  className,
  label = 'Įkelti priedus',
  description = 'PDF, DOC, XLS, ZIP ir kiti formatai iki 50MB',
  maxFiles = 10
}: FileAttachmentsUploaderProps) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>(initialAttachments)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): boolean => {
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError(`Failo dydis negali viršyti 50MB`)
      return false
    }
    
    if (attachments.length >= maxFiles) {
      setError(`Maksimaliai galima ${maxFiles} failų`)
      return false
    }

    setError(null)
    return true
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'attachment')

      const response = await fetch('/api/manage/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'File upload failed')
      }

      const data = await response.json()
      
      // Create attachment object
      const newAttachment: AttachmentFile = {
        id: Date.now().toString(),
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType
      }

      const updatedAttachments = [...attachments, newAttachment]
      setAttachments(updatedAttachments)
      onAttachmentsChange(updatedAttachments)
      return true
    } catch (error) {
      console.error('Error uploading file:', error)
      setError(error instanceof Error ? error.message : 'Unknown error during upload')
      return false
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    setError(null)
    
    // Process each file
    const filesToUpload = Array.from(fileList).filter(validateFile)
    
    if (filesToUpload.length === 0) return
    
    for (const file of filesToUpload) {
      await uploadFile(file)
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const fileList = e.dataTransfer.files
    if (!fileList || fileList.length === 0) return

    setError(null)
    
    // Process each file
    const filesToUpload = Array.from(fileList).filter(validateFile)
    
    if (filesToUpload.length === 0) return
    
    for (const file of filesToUpload) {
      await uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeAttachment = (id: string) => {
    const updatedAttachments = attachments.filter(file => file.id !== id)
    setAttachments(updatedAttachments)
    onAttachmentsChange(updatedAttachments)
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300",
          error && "border-destructive"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4 flex flex-col items-center text-sm leading-6 text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
              >
                <span>{label}</span>
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
              <p className="pl-1">arba tempkite failus čia</p>
            </div>
            <p className="text-xs leading-5 text-gray-600 mt-2">
              {description}
            </p>
            {isUploading && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Įkeliama...</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div className="bg-primary h-2.5 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            )}
          </div>
          
          {attachments.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pridėti failai</h4>
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between py-3 pl-3 pr-4 text-sm"
                  >
                    <div className="flex items-center overflow-hidden">
                      <DocumentIcon className="h-5 w-5 flex-shrink-0 text-gray-400 mr-3" />
                      <span className="truncate font-medium">{file.fileName}</span>
                      <span className="ml-2 flex-shrink-0 text-gray-400">({formatFileSize(file.fileSize)})</span>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={file.url}
                        download={file.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}