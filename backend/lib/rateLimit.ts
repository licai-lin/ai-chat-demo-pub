import type { RateLimitRecord } from "./types";

const MAX_REQUESTS = 2;
const WINDOW_MS = 60 * 1000;

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(sessionId: string): number | null {
  const now = Date.now();
  const record = rateLimitStore.get(sessionId);

  if (!record) {
    rateLimitStore.set(sessionId, { count: 1, windowStart: now });
    return null;
  }

  const elapsed = now - record.windowStart;

  if (elapsed > WINDOW_MS) {
    rateLimitStore.set(sessionId, { count: 1, windowStart: now });
    return null;
  }

  if (record.count >= MAX_REQUESTS) {
    return Math.ceil((WINDOW_MS - elapsed) / 1000);
  }

  record.count += 1;
  return null;
}

export function getRateLimitMeta() {
  return {
    trackedSessions: rateLimitStore.size,
    maxRequestsPerMinute: MAX_REQUESTS,
  };
}
