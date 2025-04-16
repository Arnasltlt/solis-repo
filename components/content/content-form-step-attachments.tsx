'use client'

import { useState, useEffect } from 'react'
import type { ContentFormData } from "@/lib/types/content"
import { FileAttachmentsUploader } from "./file-attachments-uploader"
import type { AttachmentFile } from "./file-attachments-uploader"

interface ContentFormStepAttachmentsProps {
  initialData?: Partial<ContentFormData>
  onUpdate: (data: Partial<ContentFormData>) => void
  onComplete: (stepId: string) => void
}

export function ContentFormStepAttachments({
  initialData,
  onUpdate,
  onComplete
}: ContentFormStepAttachmentsProps) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>(
    initialData?.metadata?.attachments || []
  )
  
  // Update parent form data when attachments change
  useEffect(() => {
    const metadata = { 
      ...(initialData?.metadata || {}),
      attachments 
    }
    
    onUpdate({ metadata })
    
    // Step is always considered complete, even with no attachments
    onComplete('attachments')
  }, [attachments, onUpdate, onComplete, initialData?.metadata])
  
  const handleAttachmentsChange = (files: AttachmentFile[]) => {
    setAttachments(files)
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Priedai</h3>
        <p className="text-sm text-gray-500">
          Pridėkite failus, kuriuos vartotojai galės atsisiųsti
        </p>
        
        <FileAttachmentsUploader
          initialAttachments={attachments}
          onAttachmentsChange={handleAttachmentsChange}
          className="mt-4"
        />
      </div>
    </div>
  )
}