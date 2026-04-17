export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface GenericErrorResponse {
  error: string;
  message?: string;
}

export const DEFAULT_BACKEND_PORT = 4000;
export const DEFAULT_BACKEND_ORIGIN = `http://localhost:${DEFAULT_BACKEND_PORT}`;
