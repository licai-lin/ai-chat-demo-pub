import type { Message } from "./types";
import { encoding_for_model, get_encoding, type Tiktoken, type TiktokenModel } from "@dqbd/tiktoken";

const FALLBACK_ENCODING = "o200k_base";
const DEFAULT_MODEL: TiktokenModel = "gpt-4.1-mini";

const encoderCache = new Map<string, Tiktoken>();

function getEncoder(model: TiktokenModel): Tiktoken {
  const cached = encoderCache.get(model);
  if (cached) {
    return cached;
  }

  try {
    const encoder = encoding_for_model(model);
    encoderCache.set(model, encoder);
    return encoder;
  } catch {
    const fallback = encoderCache.get(FALLBACK_ENCODING);
    if (fallback) {
      return fallback;
    }
    const encoder = get_encoding(FALLBACK_ENCODING);
    encoderCache.set(FALLBACK_ENCODING, encoder);
    return encoder;
  }
}

export function countTokens(text: string, model: TiktokenModel = DEFAULT_MODEL): number {
  if (!text) {
    return 0;
  }
  return getEncoder(model).encode(text).length;
}

export function countMessageTokens(messages: Message[], model: TiktokenModel = DEFAULT_MODEL): number {
  let total = 0;

  for (const msg of messages) {
    total += countTokens(msg.role, model);
    total += countTokens(msg.content, model);
  }

  return total;
}
