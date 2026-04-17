import OpenAI from "openai";
import type { TiktokenModel } from "@dqbd/tiktoken";
import { getConversation, saveMessage } from "./conversationStore";
import { countMessageTokens, countTokens } from "./tokenUtils";
import { canAffordDailyBudget, canAffordSessionBudget, addGlobalCost, updateUsage } from "./usage";
import type { Message } from "./types";

const MODEL_PRICING = {
  inputPer1K: 0.0005,
  outputPer1K: 0.0015,
};

const MODEL: TiktokenModel = "gpt-4.1-mini";
const MAX_OUTPUT_TOKENS = 300;
const MAX_INPUT_TOKENS = 8000;

const SYSTEM_PROMPT = `
You are an expert assistant specialized strictly in the EOS blockchain ecosystem.

Rules:
- Only answer questions related to EOS blockchain.
- If a question is unrelated to EOS, politely redirect the user back to EOS topics.
- Do NOT answer general knowledge questions.
- Do NOT answer unrelated blockchain topics unless directly connected to EOS.
- Provide technically accurate explanations.
- Use clear markdown formatting.
- Be concise but precise.
`;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

function trimHistoryByTokens(history: Message[]): Message[] {
  let totalTokens = countMessageTokens(history, MODEL);
  if (totalTokens <= MAX_INPUT_TOKENS) {
    return history;
  }

  const trimmed = [...history];
  while (trimmed.length > 2 && totalTokens > MAX_INPUT_TOKENS) {
    trimmed.splice(1, 2);
    totalTokens = countMessageTokens(trimmed, MODEL);
  }

  if (totalTokens > MAX_INPUT_TOKENS) {
    throw new Error("Input exceeds maximum token limit.");
  }

  return trimmed;
}

export async function createChatResponse(message: string, sessionId: string): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY" },
      { status: 500 },
    );
  }

  const singleMessageTokens = countTokens(message, MODEL);
  if (singleMessageTokens > MAX_INPUT_TOKENS) {
    return Response.json(
      {
        error: "Input too large",
        message: `Message exceeds the input limit of ${MAX_INPUT_TOKENS} tokens.`,
      },
      { status: 413 },
    );
  }

  const existingHistory = await getConversation(sessionId);

  let history: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...existingHistory,
    { role: "user", content: message },
  ];

  try {
    history = trimHistoryByTokens(history);
  } catch (error) {
    console.error("Token trimming failure:", formatError(error));
    return Response.json(
      {
        error: "Input too large",
        message: `Conversation exceeds the input limit of ${MAX_INPUT_TOKENS} tokens.`,
      },
      { status: 413 },
    );
  }

  const inputTokens = countMessageTokens(history, MODEL);
  const estimatedInputCost = (inputTokens / 1000) * MODEL_PRICING.inputPer1K;
  const estimatedOutputCost = (MAX_OUTPUT_TOKENS / 1000) * MODEL_PRICING.outputPer1K;
  const estimatedTotalCost = estimatedInputCost + estimatedOutputCost;

  if (!canAffordDailyBudget(estimatedTotalCost)) {
    return Response.json(
      {
        error: "Daily server usage limit reached",
        message: "This request would exceed the server's daily AI usage limit. Please try again tomorrow.",
      },
      { status: 503 },
    );
  }

  const sessionBudget = canAffordSessionBudget(sessionId, estimatedTotalCost);
  if (!sessionBudget.allowed) {
    return Response.json(
      {
        error: "Session usage limit reached.",
        message: "This request would exceed the session's maximum allowed usage. Please start a new chat.",
        currentCost: sessionBudget.currentCost.toFixed(6),
        predictedCost: sessionBudget.predictedCost.toFixed(6),
        maxCost: sessionBudget.maxCost,
      },
      { status: 403 },
    );
  }

  const stream = await client.responses.stream({
    model: MODEL,
    input: history,
    max_output_tokens: MAX_OUTPUT_TOKENS,
  });

  await saveMessage(sessionId, "user", message);

  const encoder = new TextEncoder();
  let fullReply = "";

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            const chunk = event.delta;
            fullReply += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        await saveMessage(sessionId, "assistant", fullReply);

        const outputTokens = countTokens(fullReply, MODEL);
        const realInputCost = (inputTokens / 1000) * MODEL_PRICING.inputPer1K;
        const realOutputCost = (outputTokens / 1000) * MODEL_PRICING.outputPer1K;
        const totalCost = realInputCost + realOutputCost;

        updateUsage(sessionId, inputTokens + outputTokens, totalCost);
        addGlobalCost(totalCost);

        controller.close();
      } catch (error) {
        console.error("OpenAI streaming failure:", formatError(error));
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
