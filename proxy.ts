import { NextResponse, type NextRequest } from "next/server";
import { findRedirect } from "@/lib/redirects";
import {
  getDefaultSiteId,
  getSiteBaseUrl,
  parseSiteId,
  resolveSiteIdByHost,
} from "@/lib/sites";

const SESSION_COOKIE_NAME = "promosyon_session";

const STATIC_FILE = /\.[a-zA-Z0-9]+$/;
const SITE_PREFIX = /^\/(\d+)(\/.*)?$/;

function isBypassed(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon/")
  );
}

function buildRedirectUrl(
  request: NextRequest,
  destination: string
): URL {
  const external = /^https?:\/\//i.test(destination);
  const target = external
    ? new URL(destination)
    : new URL(destination, request.nextUrl.origin);

  if (!destination.includes("?") && request.nextUrl.search) {
    target.search = request.nextUrl.search;
  }

  return target;
}

function isRedirectSafePath(pathname: string): boolean {
  return !(
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/hesabim" ||
    pathname.startsWith("/hesabim/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isBypassed(pathname)) return NextResponse.next();

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const resolvedSiteId = resolveSiteIdByHost(host);
  const siteId = parseSiteId(resolvedSiteId) ?? getDefaultSiteId();

  const isSitePrefixed = SITE_PREFIX.test(pathname);
  if (!isSitePrefixed && isRedirectSafePath(pathname)) {
    const redirect = findRedirect(siteId, pathname);
    if (redirect) {
      return NextResponse.redirect(
        buildRedirectUrl(request, redirect.destination),
        redirect.statusCode
      );
    }
  }

  if (STATIC_FILE.test(pathname)) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (
    !hasSession &&
    (pathname.startsWith("/admin") || pathname.startsWith("/hesabim"))
  ) {
    const loginUrl = new URL("/giris", getSiteBaseUrl(siteId));
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (isSitePrefixed) {
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
