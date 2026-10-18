export interface ErrorWithCode extends Error {
  code?: string | number;
}

export interface GoogleApiError extends ErrorWithCode {
  response?: {
    status?: number;
    data?: {
      error?: string;
    };
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isGoogleApiError(error: unknown): error is GoogleApiError {
  return error instanceof Error;
}
