"use client";

import { useEffect, useState } from "react";

type Stats = {
  serverTime: string;
  uptimeSeconds: number;
  globalUsage: {
    totalCostToday: string;
    dailyBudget: number;
    remainingBudget: string;
  };
  sessions: {
    activeSessions: number;
  };
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(
          `/api/admin/stats`
        );

        if (!res.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await res.json();
        setStats(data);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!stats) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">AI Server Dashboard</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Global Usage</h2>
        <p>Total Cost Today: ${stats.globalUsage.totalCostToday}</p>
        <p>Remaining Budget: ${stats.globalUsage.remainingBudget}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <p>Active Sessions: {stats.sessions.activeSessions}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Server</h2>
        <p>Uptime: {stats.uptimeSeconds}s</p>
      </div>
    </div>
  );
}
