import type { UsageRecord } from "./types";

const DAILY_GLOBAL_BUDGET = 5.0;
const MAX_SESSION_COST = 0.05;

let globalUsage = {
  totalCostToday: 0,
  lastReset: new Date().toDateString(),
};

const usageStore = new Map<string, UsageRecord>();

export function checkDailyReset() {
  const today = new Date().toDateString();
  if (globalUsage.lastReset !== today) {
    globalUsage = {
      totalCostToday: 0,
      lastReset: today,
    };
  }
}

export function getUsage(sessionId: string): UsageRecord {
  return (
    usageStore.get(sessionId) || {
      totalTokens: 0,
      totalCost: 0,
      lastUpdated: Date.now(),
    }
  );
}

export function updateUsage(sessionId: string, tokens: number, cost: number): UsageRecord {
  const existing = getUsage(sessionId);
  const updated: UsageRecord = {
    totalTokens: existing.totalTokens + tokens,
    totalCost: existing.totalCost + cost,
    lastUpdated: Date.now(),
  };

  usageStore.set(sessionId, updated);
  return updated;
}

export function getAllUsage() {
  return Array.from(usageStore.entries()).map(([id, usage]) => ({
    sessionId: id,
    ...usage,
  }));
}

export function getGlobalUsage() {
  return {
    totalCostToday: globalUsage.totalCostToday,
    dailyBudget: DAILY_GLOBAL_BUDGET,
    remainingBudget: DAILY_GLOBAL_BUDGET - globalUsage.totalCostToday,
  };
}

export function addGlobalCost(cost: number) {
  globalUsage.totalCostToday += cost;
}

export function canAffordDailyBudget(predictedCost: number): boolean {
  checkDailyReset();
  return globalUsage.totalCostToday + predictedCost <= DAILY_GLOBAL_BUDGET;
}

export function canAffordSessionBudget(sessionId: string, predictedCost: number): {
  allowed: boolean;
  currentCost: number;
  predictedCost: number;
  maxCost: number;
} {
  const currentCost = getUsage(sessionId).totalCost;
  const total = currentCost + predictedCost;

  return {
    allowed: total <= MAX_SESSION_COST,
    currentCost,
    predictedCost: total,
    maxCost: MAX_SESSION_COST,
  };
}
