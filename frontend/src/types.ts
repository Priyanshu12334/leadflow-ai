export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  draftsUsed: number;
  draftLimit: number;
  usagePeriodStart: string;
  usagePeriodResetAt: string;
  googleConnected: boolean;
  spreadsheetId: string | null;
  sheetName: string;
  createdAt: string;
}

export interface UserResponse {
  user: User;
}

export interface LeadProcessingDetail {
  action: 'created' | 'skipped' | 'failed';
  rowNumber: number;
  name: string;
  email: string;
  reason?: string;
}

export interface LeadProcessingResult {
  message: string;
  processed: number;
  created: number;
  skipped: number;
  failed: number;
  limitReached?: boolean;
  draftsUsed?: number;
  draftLimit?: number;
  usagePeriodStart?: string;
  usagePeriodResetAt?: string;
  details?: LeadProcessingDetail[];
}

export interface FollowUpLead {
  rowNumber: number;
  name: string;
  email: string;
  company: string;
  nextFollowUpDate: string | null;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    (!('status' in error) || typeof error.status === 'number' || error.status === undefined)
  );
}

export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  return isApiError(error) ? error.message : undefined;
}
