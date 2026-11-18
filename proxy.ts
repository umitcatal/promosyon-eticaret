import { NextResponse, type NextRequest } from "next/server";
import {
  getDefaultSiteId,
  getSiteBaseUrl,
  parseSiteId,
  resolveSiteIdByHost,
} from "@/lib/sites";

const SESSION_COOKIE_NAME = "promosyon_session";

const STATIC_FILE = /\.[a-zA-Z0-9]+$/;

function isBypassed(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon/") ||
    STATIC_FILE.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassed(pathname)) return NextResponse.next();

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const resolvedSiteId = resolveSiteIdByHost(host);
  const siteId = parseSiteId(resolvedSiteId) ?? getDefaultSiteId();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (
    !hasSession &&
    (pathname.startsWith("/admin") || pathname.startsWith("/hesabim"))
  ) {
    const loginUrl = new URL("/giris", getSiteBaseUrl(siteId));
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const prefixed = pathname.match(/^\/(\d+)(\/.*)?$/);
  if (prefixed) {
    const response = NextResponse.next();
    if (request.headers.get("x-site-rewrite") !== "1") {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return response;
  }

  const target = new URL(
    `/${siteId}${pathname === "/" ? "" : pathname}`,
    request.url
  );
  target.search = search;

  const headers = new Headers(request.headers);
  headers.set("x-site-rewrite", "1");

  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
