export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }

  static notFound(message: string, details?: unknown) {
    return new AppError(message, 'NOT_FOUND', 404, details)
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 'BAD_REQUEST', 400, details)
  }

  static unauthorized(message: string, details?: unknown) {
    return new AppError(message, 'UNAUTHORIZED', 401, details)
  }

  static forbidden(message: string, details?: unknown) {
    return new AppError(message, 'FORBIDDEN', 403, details)
  }

  static internal(message: string, details?: unknown) {
    return new AppError(message, 'INTERNAL_ERROR', 500, details)
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, error)
  }

  return new AppError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    error
  )
} 