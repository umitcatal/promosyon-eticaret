export const RECENTLY_VIEWED_STORAGE_KEY = "promosyon_recently_viewed";
export const RECENTLY_VIEWED_MAX_ITEMS = 12;
export const RECENTLY_VIEWED_TTL_DAYS = 30;

export type RecentlyViewedEntry = {
  id: number;
  seenAt: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseEntries(raw: string | null): RecentlyViewedEntry[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - RECENTLY_VIEWED_TTL_DAYS * DAY_MS;
    return parsed
      .map((item) => {
        const record = (item ?? {}) as { id?: unknown; seenAt?: unknown };
        return { id: Number(record.id), seenAt: Number(record.seenAt) };
      })
      .filter(
        (entry) =>
          Number.isInteger(entry.id) &&
          entry.id > 0 &&
          Number.isFinite(entry.seenAt) &&
          entry.seenAt >= cutoff
      )
      .sort((a, b) => b.seenAt - a.seenAt);
  } catch {
    return [];
  }
}

function readEntries(): RecentlyViewedEntry[] {
  try {
    return parseEntries(window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function readRecentlyViewedIds(): number[] {
  if (typeof window === "undefined") return [];

  const ids: number[] = [];
  const seen = new Set<number>();
  for (const entry of readEntries()) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    ids.push(entry.id);
  }

  return ids.slice(0, RECENTLY_VIEWED_MAX_ITEMS);
}

export function recordRecentlyViewedProduct(productId: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(productId) || productId <= 0) return;

  const entries = readEntries().filter((entry) => entry.id !== productId);
  entries.unshift({ id: productId, seenAt: Date.now() });

  try {
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(entries.slice(0, RECENTLY_VIEWED_MAX_ITEMS))
    );
  } catch {
    // Özel mod / kota aşımı: izleme kaydı bölümü etkilemez.
  }
}
