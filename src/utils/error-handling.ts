import { WPError } from '../types/index.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromWPError(error: WPError, statusCode: number = 400): ApiError {
    return new ApiError(
      error.message,
      error.data?.status || statusCode,
      error.code,
      error.data?.details
    );
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Format error for MCP response
 */
export function formatError(error: unknown): { type: 'text'; text: string } {
  if (isApiError(error)) {
    return {
      type: 'text',
      text: `Error ${error.statusCode}: ${error.message}${error.code ? ` (${error.code})` : ''}`
    };
  }

  if (error instanceof Error) {
    return {
      type: 'text',
      text: `Error: ${error.message}`
    };
  }

  return {
    type: 'text',
    text: 'An unknown error occurred'
  };
}