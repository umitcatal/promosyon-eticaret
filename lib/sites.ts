const FALLBACK_SITE_IDS = [1, 2];

let idsCache: number[] | null = null;
let hostMapCache: Map<string, number> | null = null;
let urlMapCache: Map<number, string> | null = null;

function parsePositiveInt(value: string | undefined): number | null {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getSiteIds(): number[] {
  if (idsCache) return idsCache;

  const raw = process.env.SITE_IDS?.trim();
  const parsed = raw
    ? raw
        .split(",")
        .map((entry) => parsePositiveInt(entry))
        .filter((id): id is number => id !== null)
    : [];

  idsCache = parsed.length
    ? [...new Set(parsed)].sort((a, b) => a - b)
    : [...FALLBACK_SITE_IDS];

  return idsCache;
}

export function getDefaultSiteId(): number {
  const ids = getSiteIds();
  const configured = parsePositiveInt(process.env.DEFAULT_SITE_ID);
  return configured !== null && ids.includes(configured) ? configured : ids[0];
}

export function parseSiteId(
  value: string | number | null | undefined
): number | null {
  const parsed = parsePositiveInt(String(value ?? ""));
  return parsed !== null && getSiteIds().includes(parsed) ? parsed : null;
}

export function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
}

function getHostMap(): Map<string, number> {
  if (hostMapCache) return hostMapCache;

  const map = new Map<string, number>();
  const raw = process.env.SITE_HOSTS?.trim();
  if (raw) {
    for (const entry of raw.split(",")) {
      const match = entry.trim().match(/^(.+?)\s*[:=]\s*(\d+)$/);
      if (!match) continue;
      const host = normalizeHost(match[1]);
      const id = parsePositiveInt(match[2]);
      if (host && id !== null && getSiteIds().includes(id)) {
        map.set(host, id);
      }
    }
  }

  hostMapCache = map;
  return map;
}

export function getSiteHosts(siteId: number): string[] {
  const hosts: string[] = [];
  for (const [host, id] of getHostMap()) {
    if (id === siteId) hosts.push(host);
  }
  return hosts;
}

export function resolveSiteIdByHost(
  hostHeader: string | null | undefined
): number {  const hosts = String(hostHeader ?? "")
    .split(",")
    .map((host) => normalizeHost(host))
    .filter(Boolean);

  const map = getHostMap();
  for (const host of hosts) {
    const id = map.get(host);
    if (id !== undefined) return id;
  }

  return getDefaultSiteId();
}

function getUrlMap(): Map<number, string> {
  if (urlMapCache) return urlMapCache;

  const map = new Map<number, string>();
  const raw = process.env.SITE_URLS?.trim();
  if (raw) {
    for (const entry of raw.split(",")) {
      const match = entry.trim().match(/^(\d+)\s*[:=]\s*(.+)$/);
      if (!match) continue;
      const id = parsePositiveInt(match[1]);
      const url = match[2].trim().replace(/\/+$/, "");
      if (id !== null && url && getSiteIds().includes(id)) {
        map.set(id, url);
      }
    }
  }

  urlMapCache = map;
  return map;
}

export function getSiteBaseUrl(id: number): string {
  const configured = getUrlMap().get(id);
  if (configured) return configured;

  if (id === getDefaultSiteId()) {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
      /\/+$/,
      ""
    );
  }

  return `http://localhost:${process.env.PORT ?? "3000"}`;
}
