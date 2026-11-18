import { NextResponse, type NextRequest } from "next/server";
import { parseSiteId, resolveSiteIdByHost } from "@/lib/sites";

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

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (
    !hasSession &&
    (pathname.startsWith("/admin") || pathname.startsWith("/hesabim"))
  ) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const prefixed = pathname.match(/^\/(\d+)(\/.*)?$/);
  if (prefixed) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const siteId = resolveSiteIdByHost(host);
  if (parseSiteId(siteId) === null) return NextResponse.next();

  const target = new URL(
    `/${siteId}${pathname === "/" ? "/" : pathname}`,
    request.url
  );
  target.search = search;

  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
