'use client'

import { DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import type { AttachmentFile } from './file-attachments-uploader'

interface ContentDetailAttachmentsProps {
  attachments: AttachmentFile[]
}

export function ContentDetailAttachments({ attachments }: ContentDetailAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadAllFiles = () => {
    // Create an invisible anchor element for each file and click it
    attachments.forEach(file => {
      const link = document.createElement('a')
      link.href = `/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.fileName)}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => {}, 100)
    })
  }

  return (
    <div className="mt-6 border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Pridėti failai</h3>
        {attachments.length > 1 && (
          <button
            onClick={downloadAllFiles}
            className="flex items-center text-sm text-primary hover:text-primary/80"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Atsisiųsti visus
          </button>
        )}
      </div>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
        {attachments.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between py-3 pl-3 pr-4 text-sm hover:bg-gray-50"
          >
            <div className="flex items-center overflow-hidden">
              <DocumentIcon className="h-5 w-5 flex-shrink-0 text-gray-400 mr-3" />
              <span className="truncate font-medium">{file.fileName}</span>
              <span className="ml-2 flex-shrink-0 text-gray-400">
                ({formatFileSize(file.fileSize)})
              </span>
            </div>
            <div>
              <a
                href={`/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.fileName)}`}
                className="text-primary hover:text-primary/80"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}