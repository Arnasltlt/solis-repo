"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { X } from "lucide-react"

export interface FileUploadProps {
  value: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
  onChange: (files: Array<{
    name: string
    url: string
    type: string
    size: number
  }>) => void
  maxSize?: number // in MB
  className?: string
}

export function FileUpload({ value = [], onChange, maxSize = 10, className }: FileUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        console.warn(`File ${file.name} is too large. Maximum size is ${maxSize}MB`)
        return false
      }
      return true
    })

    const newFiles = validFiles.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size
    }))

    onChange([...value, ...newFiles])
  }

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-yellow-50 file:text-yellow-700
          hover:file:bg-yellow-100"
        multiple
      />
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
              <div className="flex-1 text-sm truncate">
                <span className="font-medium">{file.name}</span>
                <span className="text-gray-500 ml-2">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 