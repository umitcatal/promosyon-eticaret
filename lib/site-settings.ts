import { db } from "./db";

export type SiteRow = {
  id: number;
  name: string;
  slug: string;
  active: number;
  created_at: string;
};

export type SiteIdentity = {
  siteId: number;
  siteName: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  logoUrl: string | null;
};

export const SITE_NAME_KEY = "site_name";
export const SEO_TITLE_KEY = "seo_title";
export const SEO_DESCRIPTION_KEY = "seo_description";
export const OG_IMAGE_KEY = "og_image_url";
export const LOGO_URL_KEY = "logo_url";

const DEFAULT_SITE_NAME = "Kurumsal Promo";
const DEFAULT_SEO_DESCRIPTION =
  "Kurumsal promosyon ürünleri: kalem, çanta, teknoloji, termos ve daha fazlası. Şirket logonuzla özelleştirilebilen yüzlerce ürün.";
const DEFAULT_OG_IMAGE = "/logo-meta.jpg";

export function listSites(): SiteRow[] {
  return db
    .prepare(
      "SELECT id, name, slug, active, created_at FROM sites ORDER BY id"
    )
    .all() as SiteRow[];
}

export function getSiteRow(siteId: number): SiteRow | null {
  const row = db
    .prepare(
      "SELECT id, name, slug, active, created_at FROM sites WHERE id = ?"
    )
    .get(siteId) as SiteRow | undefined;
  return row ?? null;
}

export function getSiteSetting(siteId: number, key: string): string | null {
  const row = db
    .prepare("SELECT value FROM site_settings WHERE site_id = ? AND key = ?")
    .get(siteId, key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSiteSetting(siteId: number, key: string, value: string) {
  db.prepare(
    `INSERT INTO site_settings (site_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(site_id, key) DO UPDATE SET value = excluded.value`
  ).run(siteId, key, value);
}

export function getSiteSettings(siteId: number): Record<string, string> {
  const rows = db
    .prepare("SELECT key, value FROM site_settings WHERE site_id = ?")
    .all(siteId) as { key: string; value: string }[];
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function trimmedSetting(siteId: number, key: string): string {
  return getSiteSetting(siteId, key)?.trim() ?? "";
}

export function getSiteIdentity(siteId: number): SiteIdentity {
  const row = getSiteRow(siteId);
  const fallbackName = row?.name?.trim() || DEFAULT_SITE_NAME;
  const siteName = trimmedSetting(siteId, SITE_NAME_KEY) || fallbackName;

  return {
    siteId,
    siteName,
    seoTitle:
      trimmedSetting(siteId, SEO_TITLE_KEY) ||
      `${siteName} | Kurumsal Promosyon Ürünleri`,
    seoDescription:
      trimmedSetting(siteId, SEO_DESCRIPTION_KEY) || DEFAULT_SEO_DESCRIPTION,
    ogImageUrl: trimmedSetting(siteId, OG_IMAGE_KEY) || DEFAULT_OG_IMAGE,
    logoUrl: trimmedSetting(siteId, LOGO_URL_KEY) || null,
  };
}

export function getSiteDisplayName(siteId: number): string {
  return getSiteIdentity(siteId).siteName;
}

export function siteExists(siteId: number): boolean {
  return getSiteRow(siteId) !== null;
}
