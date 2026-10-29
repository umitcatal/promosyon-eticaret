import { XMLParser } from "fast-xml-parser";
import { getXmlPathRelative, readXmlFile, saveXmlFile } from "./xml-file";

export type XmlRecord = {
  kategori?: string;
  urun_id?: string;
  urunkodu?: string;
  urunattr_id?: string;
  urunattrgr?: string;
  urunattradi?: string;
  urunadi?: string;
  urunaciklamasi?: string;
  stokresim?: string;
  urunresim?: string;
  stoktag?: string;
  fiyat?: string | number;
  listefiyati?: string | number;
  netfiyat?: string | number;
  iskonto?: string | number;
  stokmiktar?: string | number;
  urunbaskifiyatlari?: string;
  satisfiyati?: string | number;
  satis_fiyati?: string | number;
  bayifiyat?: string | number;
  kurumfiyat?: string | number;
  tutar?: string | number;
  bedel?: string | number;
  price?: string | number;
  [key: `urunresim${number}`]: string | undefined;
};

export const DEFAULT_PRODUCT_XML_URL =
  "https://api.akdenizerp.com/xml/xmlweb.xml";

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: false,
  isArray: (name) => name === "RECORD",
});

export function parseCatalogXml(xml: string): XmlRecord[] {
  const parsed = parser.parse(xml) as {
    RECORDS?: { RECORD?: XmlRecord[] };
  };
  return parsed.RECORDS?.RECORD ?? [];
}

export type XmlSource = "api" | "file";

export type LoadedCatalogXml = {
  xml: string;
  source: XmlSource;
  path: string;
};

export async function loadCatalogXml(): Promise<LoadedCatalogXml> {
  const url =
    process.env.PRODUCT_XML_URL?.trim() || DEFAULT_PRODUCT_XML_URL;
  const problems: string[] = [];

  try {
    const response = await fetch(url, {
      headers: { accept: "application/xml,text/xml,*/*" },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const xml = await response.text();
    if (!xml.trim()) {
      throw new Error("yanıt boş döndü");
    }
    saveXmlFile(xml);
    const saved = readXmlFile() ?? xml;
    if (parseCatalogXml(saved).length > 0) {
      return { xml: saved, source: "api", path: getXmlPathRelative() };
    }
    problems.push(`${url}: XML içinde kayıt bulunamadı`);
  } catch (error) {
    problems.push(`${url}: ${(error as Error).message}`);
  }

  const relativePath = getXmlPathRelative();
  try {
    const fileXml = readXmlFile();
    if (fileXml === null) {
      problems.push(`${relativePath}: dosya bulunamadı`);
    } else if (!fileXml.trim()) {
      problems.push(`${relativePath}: dosya boş`);
    } else if (parseCatalogXml(fileXml).length === 0) {
      problems.push(`${relativePath}: XML içinde kayıt bulunamadı`);
    } else {
      return { xml: fileXml, source: "file", path: relativePath };
    }
  } catch (error) {
    problems.push(`${relativePath}: ${(error as Error).message}`);
  }

  throw new Error(
    `XML kaynağına ulaşılamadı. ${problems.join(" | ")}. ` +
      `Sunucudan XML dosyasını indirip "${relativePath}" yoluna koyun ` +
      `veya PRODUCT_XML_URL adresini kontrol edin.`
  );
}

const PRICE_FIELD_CANDIDATES = [
  "listefiyati",
  "netfiyat",
  "fiyat",
  "satisfiyati",
  "satis_fiyati",
  "satisfiyat",
  "bayifiyat",
  "kurumfiyat",
  "birimfiyat",
  "tutar",
  "bedel",
  "price",
];

export function extractPrice(record: XmlRecord): number | null {
  const entries = Object.entries(record) as [string, unknown][];
  const lowerValues = new Map<string, unknown>();
  for (const [key, value] of entries) {
    lowerValues.set(key.toLocaleLowerCase("tr"), value);
  }

  for (const candidate of PRICE_FIELD_CANDIDATES) {
    if (!lowerValues.has(candidate)) continue;
    const price = parseTurkishPrice(lowerValues.get(candidate));
    if (price !== null) return price;
  }

  const fuzzy = entries
    .filter(([key]) => key.toLocaleLowerCase("tr").includes("fiyat"))
    .sort(([a], [b]) => a.localeCompare(b, "tr"));
  for (const [, value] of fuzzy) {
    const price = parseTurkishPrice(value);
    if (price !== null) return price;
  }

  return null;
}

export function parseTurkishPrice(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  if (typeof raw !== "string") return null;

  let value = raw.trim().replace(/₺|\bTL\b/gi, "").replace(/\s/g, "");
  if (!value) return null;

  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  if (hasComma && hasDot) {
    if (value.lastIndexOf(",") > value.lastIndexOf(".")) {
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = value.split(",");
    value =
      parts.length === 2 ? value.replace(",", ".") : value.replace(/,/g, "");
  } else if (hasDot) {
    const parts = value.split(".");
    if (parts.length > 2) {
      value = value.replace(/\./g, "");
    } else if (parts.length === 2 && parts[1].length === 3) {
      value = value.replace(/\./g, "");
    }
  }

  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return null;
  return price;
}

export function parseStock(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

export function parseRatio(raw: unknown): number | null {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function cleanDescription(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>\s*\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}\s*$/i, "")
    .replace(/(<br\s*\/?>\s*)+$/i, "")
    .trim();
}

export function extractImages(record: XmlRecord): string[] {
  const urls: string[] = [];
  for (let i = 1; i <= 13; i += 1) {
    const url = record[`urunresim${i}`];
    if (typeof url === "string" && url.trim()) urls.push(url.trim());
  }
  if (record.urunresim?.trim()) urls.push(record.urunresim.trim());
  if (record.stokresim?.trim()) urls.push(record.stokresim.trim());
  return [...new Set(urls)];
}

export function parseCategoryPath(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
}
