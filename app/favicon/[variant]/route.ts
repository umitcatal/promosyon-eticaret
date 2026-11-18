import { connection } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_FAVICON,
  getSiteFavicon,
  type SiteFavicon,
} from "@/lib/site-settings";
import { resolveSiteIdByHost } from "@/lib/sites";

// Stable URLs so the prerendered layout never bakes a site's uploaded path;
// the host decides which icon is served on every request.
const VARIANTS: Record<string, keyof SiteFavicon> = {
  "32": "icon32",
  apple: "apple",
  "192": "icon192",
  "512": "icon512",
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/favicon/[variant]">
) {
  await connection();

  const { variant } = await params;
  const key = VARIANTS[variant];
  if (!key) return new Response("Bulunamadı", { status: 404 });

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const siteId = resolveSiteIdByHost(host);
  const favicon = getSiteFavicon(siteId) ?? DEFAULT_FAVICON;

  return new Response(null, {
    status: 307,
    headers: {
      Location: favicon[key],
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
