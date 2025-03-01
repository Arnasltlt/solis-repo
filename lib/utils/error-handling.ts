import { toast } from '@/hooks/use-toast'

/**
 * Error types for categorizing different errors
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

/**
 * Error details interface for structured error information
 */
interface ErrorDetails {
  type: ErrorType
  message: string
  userMessage: string
  recoverySuggestion: string
  technical?: string
}

/**
 * Map of common error patterns to error types
 */
const ERROR_PATTERNS = [
  { pattern: /network|fetch|timeout|offline/i, type: ErrorType.NETWORK },
  { pattern: /auth|login|sign in|unauthorized|401/i, type: ErrorType.AUTHENTICATION },
  { pattern: /forbidden|permission|access denied|403/i, type: ErrorType.AUTHORIZATION },
  { pattern: /not found|404|no results/i, type: ErrorType.NOT_FOUND },
  { pattern: /validation|invalid|required|format/i, type: ErrorType.VALIDATION },
  { pattern: /server|500|internal/i, type: ErrorType.SERVER }
]

/**
 * User-friendly messages for different error types
 */
const USER_MESSAGES = {
  [ErrorType.NETWORK]: 'Nepavyko prisijungti prie serverio',
  [ErrorType.AUTHENTICATION]: 'Reikalingas prisijungimas',
  [ErrorType.AUTHORIZATION]: 'Neturite teisių atlikti šį veiksmą',
  [ErrorType.NOT_FOUND]: 'Ieškoma informacija nerasta',
  [ErrorType.VALIDATION]: 'Pateikti duomenys yra neteisingi',
  [ErrorType.SERVER]: 'Įvyko serverio klaida',
  [ErrorType.UNKNOWN]: 'Įvyko nenumatyta klaida'
}

/**
 * Recovery suggestions for different error types
 */
const RECOVERY_SUGGESTIONS = {
  [ErrorType.NETWORK]: 'Patikrinkite interneto ryšį ir bandykite dar kartą',
  [ErrorType.AUTHENTICATION]: 'Prisijunkite ir bandykite dar kartą',
  [ErrorType.AUTHORIZATION]: 'Kreipkitės į administratorių dėl prieigos teisių',
  [ErrorType.NOT_FOUND]: 'Patikrinkite, ar teisingai įvedėte informaciją',
  [ErrorType.VALIDATION]: 'Patikrinkite įvestus duomenis ir bandykite dar kartą',
  [ErrorType.SERVER]: 'Bandykite dar kartą vėliau',
  [ErrorType.UNKNOWN]: 'Atnaujinkite puslapį ir bandykite dar kartą'
}

/**
 * Analyzes an error and returns structured error details
 */
export function analyzeError(error: any): ErrorDetails {
  // Extract error message
  const errorMessage = error?.message || error?.toString() || 'Unknown error'
  
  // Determine error type based on patterns
  let errorType = ErrorType.UNKNOWN
  for (const { pattern, type } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      errorType = type
      break
    }
  }
  
  // For Supabase errors, check the error code
  if (error?.code) {
    if (error.code === 'PGRST301' || error.code === '404') {
      errorType = ErrorType.NOT_FOUND
    } else if (error.code === 'PGRST401' || error.code === '401') {
      errorType = ErrorType.AUTHENTICATION
    } else if (error.code === 'PGRST403' || error.code === '403') {
      errorType = ErrorType.AUTHORIZATION
    } else if (error.code.startsWith('PGRST5') || error.code === '500') {
      errorType = ErrorType.SERVER
    }
  }
  
  return {
    type: errorType,
    message: errorMessage,
    userMessage: USER_MESSAGES[errorType],
    recoverySuggestion: RECOVERY_SUGGESTIONS[errorType],
    technical: error?.stack || error?.toString()
  }
}

/**
 * Handles an error by logging it and showing a toast notification
 */
export function handleError(error: any, context?: string): ErrorDetails {
  const errorDetails = analyzeError(error)
  
  // Log the error with context
  console.error(
    `Error${context ? ` in ${context}` : ''}:`,
    errorDetails.message,
    { type: errorDetails.type, technical: errorDetails.technical }
  )
  
  // Show toast notification
  toast({
    variant: "destructive",
    title: errorDetails.userMessage,
    description: errorDetails.recoverySuggestion
  })
  
  return errorDetails
}

/**
 * Creates a custom error with a specific type
 */
export function createError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN
): Error & { type: ErrorType } {
  const error = new Error(message) as Error & { type: ErrorType }
  error.type = type
  return error
}

/**
 * Example usage:
 * 
 * try {
 *   // Some operation that might fail
 *   await fetchData()
 * } catch (error) {
 *   handleError(error, 'fetchData')
 * }
 */ 