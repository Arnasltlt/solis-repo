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

  const downloadAllFiles = async () => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    for (const file of attachments) {
      const link = document.createElement('a')
      link.href = `/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.fileName)}`
      link.setAttribute('download', file.fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Small delay to avoid browser throttling of multiple downloads
      await wait(300)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Priedai</h3>
        {attachments.length > 1 && (
          <button
            onClick={downloadAllFiles}
            className="text-sm text-blue-600 hover:underline"
          >
            Atsisiųsti visus
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {attachments.map((file) => (
          <li key={file.id} className="flex items-center">
            <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm">
              <a 
                href={`/api/download?url=${encodeURIComponent(file.url)}&name=${encodeURIComponent(file.fileName)}`}
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