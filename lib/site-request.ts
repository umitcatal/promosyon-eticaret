import { cookies, headers } from "next/headers";
import { parseSiteId, resolveSiteIdByHost } from "./sites";

export const ADMIN_SITE_COOKIE = "admin_site";

export async function getRequestSiteId(): Promise<number> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  return resolveSiteIdByHost(host);
}

export async function getAdminSiteId(): Promise<number> {
  const cookieStore = await cookies();
  const fromCookie = parseSiteId(cookieStore.get(ADMIN_SITE_COOKIE)?.value);
  if (fromCookie !== null) return fromCookie;

  return getRequestSiteId();
}
