'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

/**
 * ErrorBoundary - Component to catch and handle errors gracefully
 * 
 * This component provides a consistent error handling experience:
 * - Catches JavaScript errors in child components
 * - Displays a user-friendly error message
 * - Provides a retry button to attempt recovery
 */
export function ErrorBoundary({ 
  children, 
  fallback,
  onReset
}: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Define error handler
    const errorHandler = (error: ErrorEvent) => {
      console.error('Error caught by ErrorBoundary:', error)
      setError(error.error || new Error(error.message))
      setHasError(true)
    }

    // Add event listener
    window.addEventListener('error', errorHandler)

    // Clean up
    return () => {
      window.removeEventListener('error', errorHandler)
    }
  }, [])

  // Reset error state
  const handleReset = () => {
    setHasError(false)
    setError(null)
    onReset?.()
  }

  // If no error, render children
  if (!hasError) {
    return <>{children}</>
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default error UI
  return (
    <div className="p-6 max-w-md mx-auto">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Klaida</AlertTitle>
        <AlertDescription>
          {error?.message || 'Įvyko nenumatyta klaida.'}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col gap-4 items-center">
        <p className="text-sm text-muted-foreground text-center">
          Atsiprašome už nepatogumus. Bandykite atnaujinti puslapį arba grįžkite vėliau.
        </p>
        
        <Button onClick={handleReset} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Bandyti dar kartą
        </Button>
      </div>
    </div>
  )
}

/**
 * AsyncErrorBoundary - Component to catch and handle async errors
 * 
 * This component is specifically designed for handling async data fetching errors.
 */
export function AsyncErrorBoundary({ 
  error,
  reset,
  className = ''
}: { 
  error: Error
  reset: () => void
  className?: string
}) {
  return (
    <div className={`p-6 ${className}`}>
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Klaida gaunant duomenis</AlertTitle>
        <AlertDescription>
          {error?.message || 'Nepavyko užkrauti duomenų.'}
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col gap-4 items-center">
        <p className="text-sm text-muted-foreground text-center">
          Atsiprašome už nepatogumus. Bandykite atnaujinti puslapį arba grįžkite vėliau.
        </p>
        
        <Button onClick={reset} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Bandyti dar kartą
        </Button>
      </div>
    </div>
  )
} 