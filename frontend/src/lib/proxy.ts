/**
 * Tiny reverse proxy used by the API routes under `src/app/api/`.
 *
 * Why have it at all: the browser only ever talks to the Next.js host
 * (e.g. frontend-production-6c57.up.railway.app). That keeps cookies and
 * CORS simple. The Django and FastAPI services live on internal Railway
 * URLs the browser can't reach. So requests come into a Next.js route
 * handler, and the handler calls `proxyRequest` to forward them on.
 *
 * Hop-by-hop headers are stripped on both sides — they're meaningful only
 * between two adjacent hops and break things if forwarded blindly (looking
 * at you, `content-length`, which lies once the body is re-encoded).
 */
import { NextRequest, NextResponse } from "next/server";

// RFC 7230 § 6.1 — these belong to the connection, not the message.
const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

// Re-build the upstream URL from the catch-all `[...path]` segments and
// preserve any query string. We also keep the trailing-slash convention
// the caller used, because Django REST Framework treats `/foo` and
// `/foo/` as different routes and is picky about it.
function joinUrl(
  baseUrl: string,
  path: string[],
  search: string,
  trailingSlash: boolean
) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.map(encodeURIComponent).join("/");
  const suffix = trailingSlash && normalizedPath ? "/" : "";
  return `${normalizedBase}/${normalizedPath}${suffix}${search}`;
}

/**
 * Forward `request` to `baseUrl/path` and stream the response back.
 *
 * `redirect: "manual"` means we don't follow 3xx ourselves — we hand the
 * redirect to the browser so its address bar stays in sync.
 */
export async function proxyRequest(
  request: NextRequest,
  baseUrl: string,
  path: string[] = []
) {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  // GET/HEAD have no body. For everything else, copy the request body
  // through as a buffer so multipart uploads (avatar, lab reports) work.
  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(
    joinUrl(
      baseUrl,
      path,
      request.nextUrl.search,
      request.nextUrl.pathname.endsWith("/")
    ),
    init
  );
  const responseHeaders = new Headers(upstream.headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
