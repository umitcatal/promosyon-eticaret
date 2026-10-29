export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseSqliteDate(value: string): Date {
  if (value.includes("T")) return new Date(value);
  return new Date(`${value.replace(" ", "T")}Z`);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parseSqliteDate(value));
}

export function firstImage(imagesJson: string | null | undefined): string | null {
  if (!imagesJson) return null;
  try {
    const images = JSON.parse(imagesJson) as unknown;
    if (!Array.isArray(images)) return null;
    const first = images.find(
      (image): image is string => typeof image === "string" && image.length > 0
    );
    return first ?? null;
  } catch {
    return null;
  }
}

export function parseImages(imagesJson: string | null | undefined): string[] {
  if (!imagesJson) return [];
  try {
    const images = JSON.parse(imagesJson) as unknown;
    if (!Array.isArray(images)) return [];
    return images.filter(
      (image): image is string => typeof image === "string" && image.length > 0
    );
  } catch {
    return [];
  }
}

export function descriptionToText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
