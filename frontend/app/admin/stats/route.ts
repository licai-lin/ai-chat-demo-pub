export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/api/admin/stats", url.origin);
  return Response.redirect(target, 307);
}
