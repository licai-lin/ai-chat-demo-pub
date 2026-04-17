import { DEFAULT_BACKEND_ORIGIN } from "@/lib/chatContracts";

export const runtime = "nodejs";

function getBackendUrl(path: string): string {
  const origin = process.env.BACKEND_API_URL || DEFAULT_BACKEND_ORIGIN;
  return `${origin}${path}`;
}

export async function GET() {
  try {
    const backendResponse = await fetch(getBackendUrl("/api/admin/stats"), {
      method: "GET",
      cache: "no-store",
    });

    const contentType = backendResponse.headers.get("content-type") || "application/json";
    const body = await backendResponse.text();

    return new Response(body, {
      status: backendResponse.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Backend /api/admin/stats proxy error:", error);
    return Response.json({ error: "Backend service unavailable" }, { status: 503 });
  }
}
