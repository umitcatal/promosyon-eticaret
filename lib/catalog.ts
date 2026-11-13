export const MAX_CATALOG_BYTES = 150 * 1024 * 1024;
export const CATALOG_CHUNK_BYTES = 512 * 1024;
export const CATALOG_SETTING_KEY = "header_catalog";

export type CatalogSettings = {
  enabled: boolean;
  label: string;
  source: "url" | "file";
  url: string;
  fileUrl: string;
  fileName: string;
  openInNewTab: boolean;
};

export const DEFAULT_CATALOG_SETTINGS: CatalogSettings = {
  enabled: false,
  label: "Katalog",
  source: "url",
  url: "",
  fileUrl: "",
  fileName: "",
  openInNewTab: true,
};

export function isCatalogExternalUrl(value: string): boolean {
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function getCatalogHref(settings: CatalogSettings): string | null {
  if (!settings.enabled || !settings.label.trim()) return null;
  if (settings.source === "file") return settings.fileUrl || null;
  return isCatalogExternalUrl(settings.url) ? settings.url : null;
}
