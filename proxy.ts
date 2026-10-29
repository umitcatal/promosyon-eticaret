import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "promosyon_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (
    !hasSession &&
    (pathname.startsWith("/admin") || pathname.startsWith("/hesabim"))
  ) {
    const loginUrl = new URL("/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/hesabim/:path*"],
};
