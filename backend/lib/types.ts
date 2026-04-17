export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface RateLimitRecord {
  count: number;
  windowStart: number;
}

export interface UsageRecord {
  totalTokens: number;
  totalCost: number;
  lastUpdated: number;
}
