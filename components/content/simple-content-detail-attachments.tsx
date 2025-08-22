'use client'

import { DocumentIcon } from '@heroicons/react/24/solid'

interface SimpleAttachment {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
}

interface SimpleContentDetailAttachmentsProps {
  attachments: SimpleAttachment[]
}

export function SimpleContentDetailAttachments({ attachments }: SimpleContentDetailAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-2">Priedai</h3>
      <ul className="space-y-2">
        {attachments.map((file) => (
          <li key={file.id} className="flex items-center">
            <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm">
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {file.fileName}
              </a>
              <span className="text-gray-500 ml-2">
                ({(file.fileSize / 1024).toFixed(1)} KB)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}