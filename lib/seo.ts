import type { Metadata } from "next";

type OpenGraphIdentity = {
  siteName: string;
  ogImageUrl: string;
};

export function openGraphBase(
  baseUrl: string,
  identity: OpenGraphIdentity
): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: identity.siteName,
    locale: "tr_TR",
    images: [
      {
        url: absoluteUrl(baseUrl, identity.ogImageUrl) ?? identity.ogImageUrl,
        width: 1200,
        height: 630,
        alt: identity.siteName,
      },
    ],
  };
}

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

export function absoluteUrl(baseUrl: string, url: string): string | null {
  try {
    return new URL(url, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  } catch {
    return null;
  }
}

export function canonicalPath(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${cleanPath(path)}`;
}

// Variant images arrive absolute (S3) while category uploads arrive relative
// (/uploads/...); og:image and image-sitemap <loc> both need the absolute form.
export function absoluteImages(
  baseUrl: string,
  ...urls: (string | null | undefined)[]
): string[] {
  return urls
    .filter((url): url is string => Boolean(url))
    .map((url) => absoluteUrl(baseUrl, url))
    .filter((url): url is string => url !== null);
}
