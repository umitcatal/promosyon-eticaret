export const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const openGraphBase = {
  type: "website",
  siteName: "Kurumsal Promo",
  locale: "tr_TR",
} as const;

// Slugs are editor-supplied, so reject anything that could escape the path
// (spaces, quotes, backslashes, percent-encoded separators) before it reaches a
// canonical tag or a <loc>.
export function isSafeSlug(slug?: string | null): slug is string {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug === slug.trim() &&
    !/[\s%<>"'`|\\]/.test(slug)
  );
}

export function cleanPath(path: string): string {
  return `/${path.replace(/^\/+/, "")}`;
}

export function absoluteUrl(url: string): string | null {
  try {
    return new URL(url, SITE_BASE).toString();
  } catch {
    return null;
  }
}

// Variant images arrive absolute (S3) while category uploads arrive relative
// (/uploads/...); og:image and image-sitemap <loc> both need the absolute form.
export function absoluteImages(
  ...urls: (string | null | undefined)[]
): string[] {
  return urls
    .filter((url): url is string => Boolean(url))
    .map(absoluteUrl)
    .filter((url): url is string => url !== null);
}
