export interface ApiResponse<T = unknown> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export function success<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { ok: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(code: string, message: string): ApiErrorResponse {
  return {
    ok: false,
    error: { code, message },
  };
}
