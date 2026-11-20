export type SourceSegment =
  | { kind: "static"; value: string }
  | { kind: "param"; name: string }
  | { kind: "wildcard"; name: string };

export type RedirectSource =
  | { kind: "exact"; path: string }
  | { kind: "pattern"; segments: SourceSegment[] };

const PARAM_NAME = /^[A-Za-z0-9_]+$/;
const DESTINATION_TOKEN = /(^|\/):([A-Za-z0-9_]+)(\*?)/g;

export function normalizePath(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  let value = trimmed.replace(/\/{2,}/g, "/");
  if (!value.startsWith("/")) value = `/${value}`;
  if (value.length > 1) value = value.replace(/\/+$/, "");
  return value;
}

export function safeDecodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseSource(raw: string): {
  parsed?: RedirectSource;
  error?: string;
} {
  const path = normalizePath(raw);
  if (path === "") return { error: "Kaynak adres gerekli." };
  if (path === "/") {
    return { error: "Ana sayfa (/) için yönlendirme eklenemez." };
  }
  if (/[?#]/.test(path)) {
    return { error: "Kaynak adres yalnızca yol içermeli; ? veya # kullanılamaz." };
  }
  if (/\s/.test(path)) return { error: "Kaynak adreste boşluk olamaz." };
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) {
    return { error: "Kaynak adres alan adı içeremez; / ile başlayan bir yol girin." };
  }

  const rawSegments = path.slice(1).split("/");
  const segments: SourceSegment[] = [];
  const names = new Set<string>();
  let hasDynamic = false;

  for (let index = 0; index < rawSegments.length; index += 1) {
    const segment = rawSegments[index];

    if (!segment.startsWith(":")) {
      segments.push({ kind: "static", value: segment });
      continue;
    }

    hasDynamic = true;
    const isWildcard = segment.endsWith("*");
    const name = segment.slice(1, isWildcard ? -1 : undefined);

    if (!PARAM_NAME.test(name)) {
      return {
        error: `Geçersiz değişken adı: "${segment}". Harf, rakam ve alt çizgi kullanın.`,
      };
    }
    if (names.has(name)) {
      return { error: `":${name}" değişkeni birden fazla kez kullanılmış.` };
    }
    if (isWildcard && index !== rawSegments.length - 1) {
      return {
        error: "Joker değişken (:ad*) yalnızca desenin son bölümünde olabilir.",
      };
    }

    names.add(name);
    segments.push(
      isWildcard ? { kind: "wildcard", name } : { kind: "param", name }
    );
  }

  return {
    parsed: hasDynamic ? { kind: "pattern", segments } : { kind: "exact", path },
  };
}

export function sourceParamNames(parsed: RedirectSource): {
  name: string;
  wildcard: boolean;
}[] {
  if (parsed.kind === "exact") return [];
  return parsed.segments
    .filter(
      (segment): segment is Extract<SourceSegment, { kind: "param" | "wildcard" }> =>
        segment.kind !== "static"
    )
    .map((segment) => ({
      name: segment.name,
      wildcard: segment.kind === "wildcard",
    }));
}

export function matchRedirectSource(
  parsed: RedirectSource,
  pathname: string
): Record<string, string> | null {
  const path = normalizePath(pathname);

  if (parsed.kind === "exact") {
    return path === parsed.path ? {} : null;
  }

  const parts = path === "/" ? [] : path.slice(1).split("/");
  const params: Record<string, string> = {};
  let index = 0;

  for (const segment of parsed.segments) {
    if (segment.kind === "wildcard") {
      params[segment.name] = parts.slice(index).join("/");
      return params;
    }
    if (index >= parts.length) return null;
    if (segment.kind === "static") {
      if (parts[index] !== segment.value) return null;
    } else {
      if (parts[index] === "") return null;
      params[segment.name] = parts[index];
    }
    index += 1;
  }

  return index === parts.length ? params : null;
}

export function buildRedirectDestination(
  template: string,
  params: Record<string, string>
): string {
  return template.replace(
    DESTINATION_TOKEN,
    (match, prefix: string, name: string) => {
      const value = params[name];
      return value === undefined ? match : `${prefix}${value}`;
    }
  );
}

export function validateDestinationTemplate(
  template: string,
  parsed: RedirectSource
): string | null {
  const destination = template.trim();
  if (destination === "") return "Hedef adres gerekli.";
  if (/\s/.test(destination)) return "Hedef adreste boşluk olamaz.";

  const isExternal = /^https?:\/\//i.test(destination);
  if (
    !isExternal &&
    (!destination.startsWith("/") || destination.startsWith("//"))
  ) {
    return "Hedef adres / ile başlayan bir yol veya https:// ile başlayan tam adres olmalıdır.";
  }

  const allowed = new Map(
    sourceParamNames(parsed).map((param) => [param.name, param.wildcard])
  );

  DESTINATION_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DESTINATION_TOKEN.exec(destination)) !== null) {
    const name = match[2];
    const isWildcard = match[3] === "*";
    const sourceWildcard = allowed.get(name);

    if (sourceWildcard === undefined) {
      return `Hedef adreste tanımsız değişken var: ":${name}". Bu değişken kaynak desende tanımlı değil.`;
    }
    if (isWildcard && !sourceWildcard) {
      return `":${name}*" yalnızca kaynak desende joker (:${name}*) tanımlıysa kullanılabilir.`;
    }
  }

  return null;
}
