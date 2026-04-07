import { NextRequest } from "next/server";

import { proxyRequest } from "@/lib/proxy";

const aiOrigin = process.env.AI_INTERNAL_URL || "http://127.0.0.1:8001";

export async function GET(request: NextRequest) {
  return proxyRequest(request, aiOrigin, ["health"]);
}
