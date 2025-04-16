'use client'

import { UseFormReturn } from "react-hook-form"
import { FormSection } from "@/components/ui/form-section"
import { FileAttachmentsUploader, type AttachmentFile } from "./file-attachments-uploader"

interface ContentFormAttachmentsProps {
  form: UseFormReturn<any>
}

/**
 * ContentFormAttachments - Attachments form fields for content
 * 
 * This component includes form fields for:
 * - File attachments
 */
export function ContentFormAttachments({ form }: ContentFormAttachmentsProps) {
  // Get form values for attachments
  const attachments = form.watch('metadata.attachments') || []
  
  const handleAttachmentsChange = (files: AttachmentFile[]) => {
    form.setValue('metadata.attachments', files, { 
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    })
  }
  
  return (
    <FormSection title="Attachments" description="Add files for users to download">
      <FileAttachmentsUploader
        initialAttachments={attachments}
        onAttachmentsChange={handleAttachmentsChange}
        className="mb-4"
      />
    </FormSection>
  )
}