'use client'

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils/index"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

/**
 * FormSection - A standardized form section component
 * 
 * This component provides a consistent container for grouping related form fields:
 * - Card-based layout with title and optional description
 * - Consistent spacing and styling
 * - Customizable with className props
 */
export function FormSection({
  title,
  description,
  children,
  className,
  contentClassName
}: FormSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn("space-y-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
} 