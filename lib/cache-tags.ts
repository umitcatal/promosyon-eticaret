export type SiteCacheScope =
  | "pages"
  | "menu"
  | "slider"
  | "homepage"
  | "collections"
  | "settings";

export function siteTag(siteId: number, scope: SiteCacheScope): string {
  return `site-${siteId}:${scope}`;
}
