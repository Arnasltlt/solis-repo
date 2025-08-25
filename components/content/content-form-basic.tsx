'use client'

import { UseFormReturn } from "react-hook-form"
import { FormSection } from "@/components/ui/form-section"
import { StandardFormField } from "@/components/ui/form-field"

interface ContentFormBasicProps {
  form: UseFormReturn<any>
}

/**
 * ContentFormBasic - Basic form fields for content
 * 
 * This component includes form fields for:
 * - Content type
 * - Title
 */
export function ContentFormBasic({ form }: ContentFormBasicProps) {
  return (
    <FormSection
      title="Kortelės informacija"
      description="Įveskite pagrindinę informaciją apie turinį"
    >
      <StandardFormField
        form={form}
        name="type"
        label="Turinio tipas"
        type="select"
        required
        options={[
          { label: "Video", value: "video" },
          { label: "Daina", value: "audio" },
          { label: "Pamoka", value: "lesson_plan" },
          { label: "Žaidimas", value: "game" },
        ]}
      />

      <StandardFormField
        form={form}
        name="title"
        label="Pavadinimas"
        type="text"
        placeholder="Įveskite pavadinimą"
        required
      />

    </FormSection>
  )
} 