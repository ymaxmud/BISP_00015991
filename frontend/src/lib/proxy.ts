import { NextRequest, NextResponse } from "next/server";

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
