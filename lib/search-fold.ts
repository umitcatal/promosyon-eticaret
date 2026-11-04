export const MAX_SEARCH_QUERY_LENGTH = 80;

const TR_FOLD_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Case- and diacritic-insensitive folding shared by SQL (tr_fold) and the client. */
export function foldTr(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (char) => TR_FOLD_MAP[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeSearchQuery(raw: string | null | undefined): string {
  if (!raw) return "";
  const collapsed = raw.replace(/\s+/g, " ").trim();
  return Array.from(collapsed).slice(0, MAX_SEARCH_QUERY_LENGTH).join("");
}

export function toLikePattern(raw: string): string {
  const folded = foldTr(normalizeSearchQuery(raw));
  return `%${folded.replace(/[%_\\]/g, "\\$&")}%`;
}
