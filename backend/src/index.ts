import "dotenv/config";
import express from "express";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { createChatResponse } from "../lib/chatService";
import { checkRateLimit, getRateLimitMeta } from "../lib/rateLimit";
import { getAllUsage, getGlobalUsage } from "../lib/usage";
import { DEFAULT_BACKEND_PORT } from "../../contracts/chat";
import type { ChatRequest } from "../../contracts/chat";

const app = express();

function formatError(error: unknown) {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    return {
      name: e.name,
      message: e.message,
      code: e.code,
      type: e.type,
      status: e.status,
      stack: e.stack,
    };
  }
  return { message: String(error) };
}

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body as ChatRequest;

    if (!message || !sessionId) {
      res.status(400).json({ error: "message and sessionId are required" });
      return;
    }

    const retryAfter = checkRateLimit(sessionId);
    if (retryAfter !== null) {
      res.status(429).json({
        error: "Rate limit exceeded",
        message: "Maximum 2 requests per minute.",
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    const response = await createChatResponse(message, sessionId);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body) {
      const body = await response.text();
      res.send(body);
      return;
    }

    const nodeStream = Readable.fromWeb(response.body as unknown as NodeReadableStream);
    nodeStream.on("error", (error) => {
      console.error("Stream error:", formatError(error));
      if (!res.headersSent) {
        res.status(500).json({ error: "AI stream failed" });
      } else {
        res.end();
      }
    });

    nodeStream.pipe(res);
  } catch (error) {
    console.error("Request error:", formatError(error));
    res.status(500).json({ error: "AI request failed" });
  }
});

app.get("/api/admin/stats", (_req, res) => {
  if (process.env.ENABLE_ADMIN !== "true") {
    res.status(403).json({ error: "Admin endpoint disabled" });
    return;
  }

  const globalUsage = getGlobalUsage();
  const sessions = getAllUsage();

  res.json({
    serverTime: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    globalUsage: {
      totalCostToday: globalUsage.totalCostToday.toFixed(6),
      dailyBudget: globalUsage.dailyBudget,
      remainingBudget: globalUsage.remainingBudget.toFixed(6),
    },
    sessions: {
      activeSessions: sessions.length,
      data: sessions,
    },
    rateLimit: getRateLimitMeta(),
  });
});

export default app;

if (require.main === module) {
  const port = Number(process.env.PORT || DEFAULT_BACKEND_PORT);
  app.listen(port, () => {
    console.log(`Backend API listening on http://localhost:${port}`);
  });
}
