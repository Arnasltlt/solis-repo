'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/index"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline"

interface FormActionsProps {
  onSubmit?: () => void
  onCancel?: () => void
  onBack?: () => void
  onNext?: () => void
  submitLabel?: string
  cancelLabel?: string
  backLabel?: string
  nextLabel?: string
  isSubmitting?: boolean
  className?: string
  align?: 'left' | 'center' | 'right' | 'between'
}

/**
 * FormActions - A standardized form actions component
 * 
 * This component provides consistent action buttons for forms:
 * - Submit button (primary action)
 * - Cancel button (secondary action)
 * - Back/Next buttons for multi-step forms
 * - Loading state for the submit button
 * - Customizable alignment and labels
 */
export function FormActions({
  onSubmit,
  onCancel,
  onBack,
  onNext,
  submitLabel = "Išsaugoti",
  cancelLabel = "Atšaukti",
  backLabel = "Atgal",
  nextLabel = "Toliau",
  isSubmitting = false,
  className,
  align = 'right'
}: FormActionsProps) {
  // Determine alignment class
  const alignmentClass = {
    'left': 'justify-start',
    'center': 'justify-center',
    'right': 'justify-end',
    'between': 'justify-between'
  }[align]
  
  return (
    <div className={cn(
      "flex items-center gap-4 pt-4",
      alignmentClass,
      className
    )}>
      {/* Left-aligned buttons (Back or Cancel) */}
      <div className="flex items-center gap-2">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {backLabel}
          </Button>
        )}
        
        {align === 'between' && onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        )}
      </div>
      
      {/* Right-aligned buttons (Submit, Next, or Cancel) */}
      <div className="flex items-center gap-2">
        {align !== 'between' && onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        )}
        
        {onSubmit && !onNext && (
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saugoma...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        )}
        
        {onNext && (
          <Button
            type="button"
            onClick={onNext}
            className="gap-1"
          >
            {nextLabel}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
} 