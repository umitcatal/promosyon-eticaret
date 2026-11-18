import { site as siteParam } from "next/root-params";
import { getDefaultSiteId, parseSiteId } from "./sites";

/**
 * Reads the site id from the root `[site]` route parameter.
 * Only usable from Server Components and `"use cache"` scopes; Server Actions
 * and Route Handlers must use `lib/site-request.ts` instead.
 */
export async function getCurrentSiteId(): Promise<number> {
  return parseSiteId(await siteParam()) ?? getDefaultSiteId();
}
