import { db } from "./db";
import {
  buildRedirectDestination,
  matchRedirectSource,
  normalizePath,
  parseSource,
  safeDecodePath,
  validateDestinationTemplate,
  type RedirectSource,
} from "./redirect-pattern";

export type RedirectRule = {
  id: number;
  site_id: number;
  source: string;
  destination: string;
  status_code: number;
  note: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

export type RedirectMatch = {
  destination: string;
  statusCode: 301 | 302;
};

export type RedirectInput = {
  source: string;
  destination: string;
  statusCode: number;
  note: string | null;
  active: boolean;
};

const RESERVED_PREFIXES = [
  "/admin",
  "/hesabim",
  "/api",
  "/uploads",
  "/_next",
  "/favicon",
];

const STATIC_APP_PATHS = new Set([
  "/",
  "/urunler",
  "/sepet",
  "/giris",
  "/kayit",
  "/arama",
]);

type Row = {
  id: number;
  source: string;
  destination: string;
  status_code: number;
};

export function listRedirects(siteId: number): RedirectRule[] {
  return db
    .prepare(
      "SELECT * FROM redirects WHERE site_id = ? ORDER BY source COLLATE NOCASE"
    )
    .all(siteId) as RedirectRule[];
}

export function getRedirect(siteId: number, id: number): RedirectRule | null {
  const row = db
    .prepare("SELECT * FROM redirects WHERE site_id = ? AND id = ?")
    .get(siteId, id) as RedirectRule | undefined;
  return row ?? null;
}

function isReservedPath(path: string): boolean {
  return RESERVED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function pathHasLiveContent(siteId: number, path: string): boolean {
  if (STATIC_APP_PATHS.has(path)) return true;

  const parts = path.slice(1).split("/");
  if (parts.length === 1) {
    return Boolean(
      db
        .prepare(
          "SELECT 1 FROM pages WHERE site_id = ? AND slug = ? AND active = 1"
        )
        .get(siteId, parts[0])
    );
  }

  if (parts.length !== 2) return false;
  const [prefix, slug] = parts;

  if (prefix === "kategori") {
    return Boolean(
      db
        .prepare("SELECT 1 FROM categories WHERE slug = ? AND active = 1")
        .get(slug)
    );
  }
  if (prefix === "urun") {
    return Boolean(
      db
        .prepare(
          "SELECT 1 FROM products WHERE slug = ? AND active = 1 AND is_hidden = 0"
        )
        .get(slug)
    );
  }
  if (prefix === "koleksiyon") {
    return Boolean(
      db
        .prepare(
          "SELECT 1 FROM collections WHERE site_id = ? AND slug = ? AND active = 1"
        )
        .get(siteId, slug)
    );
  }

  return false;
}

function isExternalDestination(destination: string): boolean {
  return /^https?:\/\//i.test(destination);
}

function destinationPath(destination: string): string {
  const path = destination.split(/[?#]/)[0];
  return normalizePath(safeDecodePath(path));
}

export function validateRedirectInput(
  siteId: number,
  input: RedirectInput,
  excludeId = 0
): string | null {
  const { parsed, error } = parseSource(input.source);
  if (!parsed) return error ?? "Kaynak adres geçersiz.";

  const path = normalizePath(input.source);
  if (isReservedPath(path)) {
    return "Bu adres yönetim, hesap veya uygulama alanlarına ayrılmıştır; buraya yönlendirme eklenemez.";
  }
  if (parsed.kind === "pattern" && parsed.segments[0].kind !== "static") {
    return "Desenin ilk bölümü sabit bir yol olmalıdır (örn. /kategoriDetay/:id). Aksi halde sitenin mevcut adresleriyle çakışır.";
  }

  const destinationError = validateDestinationTemplate(
    input.destination,
    parsed
  );
  if (destinationError) return destinationError;

  if (input.statusCode !== 301 && input.statusCode !== 302) {
    return "Geçersiz yönlendirme türü seçildi.";
  }
  if (input.note && input.note.length > 200) {
    return "Açıklama en fazla 200 karakter olabilir.";
  }

  const destination = input.destination.trim();

  if (parsed.kind === "exact" && !isExternalDestination(destination)) {
    const target = destinationPath(destination);
    if (target === parsed.path) {
      return "Kaynak ve hedef adres aynı olamaz.";
    }
    if (pathHasLiveContent(siteId, parsed.path)) {
      return "Bu adres sitede mevcut bir sayfaya ait. Yönlendirme eklemek o sayfayı erişilemez yapar.";
    }
  }

  const duplicate = db
    .prepare(
      "SELECT id FROM redirects WHERE site_id = ? AND source = ? AND id != ?"
    )
    .get(siteId, path, excludeId) as { id: number } | undefined;
  if (duplicate) return "Bu kaynak adres için zaten bir kural var.";

  return null;
}

type PatternRow = {
  row: Row;
  parsed: RedirectSource;
  staticCount: number;
};

function resolveDestination(
  row: Row,
  params: Record<string, string>
): RedirectMatch | null {
  const destination = buildRedirectDestination(row.destination.trim(), params);
  if (destination === "") return null;

  return {
    destination,
    statusCode: row.status_code === 302 ? 302 : 301,
  };
}

export function findRedirect(
  siteId: number,
  rawPathname: string
): RedirectMatch | null {
  try {
    const path = normalizePath(safeDecodePath(rawPathname));
    if (path === "" || path === "/") return null;

    const rows = db
      .prepare(
        "SELECT id, source, destination, status_code FROM redirects WHERE site_id = ? AND active = 1"
      )
      .all(siteId) as Row[];

    if (rows.length === 0) return null;

    const patterns: PatternRow[] = [];

    for (const row of rows) {
      const { parsed } = parseSource(row.source);
      if (!parsed) continue;

      if (parsed.kind === "exact") {
        if (parsed.path !== path) continue;

        const destination = row.destination.trim();
        if (destination === "") continue;
        if (
          !isExternalDestination(destination) &&
          destinationPath(destination) === path
        ) {
          continue;
        }
        return {
          destination,
          statusCode: row.status_code === 302 ? 302 : 301,
        };
      }

      patterns.push({
        row,
        parsed,
        staticCount: parsed.segments.filter(
          (segment) => segment.kind === "static"
        ).length,
      });
    }

    patterns.sort((a, b) => {
      if (b.staticCount !== a.staticCount) return b.staticCount - a.staticCount;
      const aLength = a.parsed.kind === "pattern" ? a.parsed.segments.length : 0;
      const bLength = b.parsed.kind === "pattern" ? b.parsed.segments.length : 0;
      if (bLength !== aLength) return bLength - aLength;
      return a.row.id - b.row.id;
    });

    for (const { row, parsed } of patterns) {
      const params = matchRedirectSource(parsed, path);
      if (!params) continue;

      const match = resolveDestination(row, params);
      if (!match) continue;

      if (
        !isExternalDestination(match.destination) &&
        destinationPath(match.destination) === path
      ) {
        continue;
      }

      return match;
    }

    return null;
  } catch {
    return null;
  }
}
