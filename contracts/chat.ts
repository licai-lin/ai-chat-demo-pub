export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface RateLimitErrorResponse {
  error: "Rate limit exceeded";
  message: string;
  retryAfterSeconds: number;
}

export interface GenericErrorResponse {
  error: string;
  message?: string;
}

export interface AdminStatsResponse {
  serverTime: string;
  uptimeSeconds: number;
  globalUsage: {
    totalCostToday: string;
    dailyBudget: number;
    remainingBudget: string;
  };
  sessions: {
    activeSessions: number;
    data: Array<{
      sessionId: string;
      totalTokens: number;
      totalCost: number;
      lastUpdated: number;
    }>;
  };
  rateLimit: {
    trackedSessions: number;
    maxRequestsPerMinute: number;
  };
}

export const DEFAULT_BACKEND_PORT = 4000;
export const DEFAULT_BACKEND_ORIGIN = `http://localhost:${DEFAULT_BACKEND_PORT}`;
