import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onFileSelected: (file: File) => void
  onFileRemoved?: () => void
  initialPreview?: string | null
  accept?: string
  maxSizeMB?: number
  className?: string
  label?: string
  description?: string
  icon?: React.ReactNode
}

export function FileUploader({
  onFileSelected,
  onFileRemoved,
  initialPreview = null,
  accept = 'image/*',
  maxSizeMB = 10,
  className,
  label = 'Upload a file',
  description = 'PNG, JPG, GIF up to 10MB',
  icon
}: FileUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreview)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size cannot exceed ${maxSizeMB}MB`)
      return false
    }

    // Validate file type if accept is specified
    if (accept && accept !== '*') {
      const fileType = file.type
      const acceptedTypes = accept.split(',').map(type => type.trim())
      
      // Handle wildcards like image/* or */
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0]
          return fileType.startsWith(`${category}/`)
        }
        return type === fileType
      })

      if (!isAccepted) {
        setError(`Only ${accept} files are allowed`)
        return false
      }
    }

    setError(null)
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (validateFile(file)) {
        onFileSelected(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (validateFile(file)) {
        onFileSelected(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
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

  const clearFile = () => {
    if (onFileRemoved) {
      onFileRemoved()
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300",
          error && "border-destructive"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-xs rounded-lg"
            />
            <button
              type="button"
              onClick={clearFile}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {icon || null}
            <div className="mt-4 flex text-sm leading-6 text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
              >
                <span>{label}</span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept={accept}
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-gray-600">
              {description}
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
} 