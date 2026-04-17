import { DEFAULT_BACKEND_ORIGIN } from "@/lib/chatContracts";
import type { ChatRequest, GenericErrorResponse } from "@/lib/chatContracts";

export const runtime = "nodejs";

function getBackendUrl(path: string): string {
  const origin = process.env.BACKEND_API_URL || DEFAULT_BACKEND_ORIGIN;
  return `${origin}${path}`;
}

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.message || !body.sessionId) {
    return Response.json(
      { error: "message and sessionId are required" },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(getBackendUrl("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const headers = new Headers(backendResponse.headers);
    // Prevent downstream decode mismatches when proxying streamed responses.
    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    headers.set("Cache-Control", "no-store");

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers,
    });
  } catch (error) {
    console.error("Backend /api/chat proxy error:", error);
    const fallback: GenericErrorResponse = { error: "Backend service unavailable" };
    return Response.json(fallback, { status: 503 });
  }
}
