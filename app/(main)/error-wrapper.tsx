'use client'

import { AsyncErrorBoundary } from '@/components/ui/error-boundary'

export function ErrorWrapper({ error }: { error: { message: string, name: string } }) {
  return (
    <AsyncErrorBoundary 
      error={new Error(error.message)}
      reset={() => window.location.reload()} 
    />
  )
} 