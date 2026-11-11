export const PRODUCT_IMAGE_PREFIX = "/uploads/products/";

const PRODUCT_IMAGE_PATTERN =
  /^\/uploads\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;

export function isProductImageUrl(url: string): boolean {
  return PRODUCT_IMAGE_PATTERN.test(url.trim());
}

export function isRemoteImageUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidImageUrl(url: string, allowLocal = false): boolean {
  if (url.length > 2048) return false;
  if (allowLocal && isProductImageUrl(url)) return true;
  return isRemoteImageUrl(url);
}

export function splitImageUrls(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(/[,\n\r]+/)) {
    const value = part.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function parseImageUrlList(raw: string, allowLocal = false): string[] {
  return splitImageUrls(raw).filter((url) => isValidImageUrl(url, allowLocal));
}

export function dedupeImages(urls: string[]): string[] {
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
}
