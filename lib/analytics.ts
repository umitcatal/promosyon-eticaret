import { getSetting } from "./db";

export const GOOGLE_TAG_SETTING_KEY = "google_tag_id";

export type GoogleTagId = {
  id: string;
  type: "gtm" | "ga4";
};

const GTM_PATTERN = /\bGTM-[A-Z0-9]+\b/i;
const GA4_PATTERN = /\bG-[A-Z0-9]{4,}\b/i;

/**
 * Accepts either a plain ID (`GTM-P65FSNTV`, `G-XXXXXXXXXX`) or a pasted
 * Google tag snippet and extracts the ID from it.
 */
export function parseGoogleTagId(raw: string | null): GoogleTagId | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  const gtm = value.match(GTM_PATTERN)?.[0];
  if (gtm) return { id: gtm.toUpperCase(), type: "gtm" };

  const ga4 = value.match(GA4_PATTERN)?.[0];
  if (ga4) return { id: ga4.toUpperCase(), type: "ga4" };

  return null;
}

export function getGoogleTagIdSetting(): GoogleTagId | null {
  return parseGoogleTagId(getSetting(GOOGLE_TAG_SETTING_KEY));
}
