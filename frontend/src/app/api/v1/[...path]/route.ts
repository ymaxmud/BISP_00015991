import { NextRequest } from "next/server";

import { proxyRequest } from "@/lib/proxy";

const backendOrigin =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, `${backendOrigin}/api/v1`, path);
}

export { handle as GET };
export { handle as POST };
export { handle as PUT };
export { handle as PATCH };
export { handle as DELETE };
export { handle as OPTIONS };
export { handle as HEAD };
