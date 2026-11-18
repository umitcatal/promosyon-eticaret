import { connection } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_FAVICON, getSiteFavicon } from "@/lib/site-settings";
import { resolveSiteIdByHost } from "@/lib/sites";

export async function GET(request: NextRequest) {
  await connection();

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const siteId = resolveSiteIdByHost(host);
  const favicon = getSiteFavicon(siteId) ?? DEFAULT_FAVICON;

  return new Response(null, {
    status: 307,
    headers: {
      Location: favicon.icon32,
      "Cache-Control": "public, max-age=300",
    },
  });
}
