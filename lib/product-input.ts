import { z } from "zod";
import {
  dedupeImages,
  isValidImageUrl,
  isProductImageUrl,
  splitImageUrls,
} from "./image-urls";
import {
  MAX_IMAGES_PER_VARIANT,
  MAX_PRODUCT_IMAGES,
  MAX_VARIANTS,
} from "./product-limits";

export {
  MAX_IMAGES_PER_VARIANT,
  MAX_PRODUCT_IMAGES,
  MAX_VARIANTS,
} from "./product-limits";

export type ParsedVariant = {
  id?: number;
  name: string | null;
  price: number | null;
  stock: number | null;
  images: string[];
  isHidden: boolean;
};

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const imageListSchema = z
  .array(z.string({ error: "Geçersiz görsel adresi." }).max(2048, "Görsel adresi çok uzun."), {
    error: "Geçersiz görsel listesi.",
  })
  .max(
    MAX_IMAGES_PER_VARIANT,
    `Bir varyantta en fazla ${MAX_IMAGES_PER_VARIANT} görsel olabilir.`
  )
  .optional()
  .default([]);

const variantSchema = z.object(
  {
    id: z
      .number({ error: "Geçersiz varyant kimliği." })
      .int({ error: "Geçersiz varyant kimliği." })
      .positive({ error: "Geçersiz varyant kimliği." })
      .optional(),
    name: z
      .string({ error: "Geçersiz varyant adı." })
      .max(120, "Varyant adı en fazla 120 karakter olabilir.")
      .optional()
      .default(""),
    price: z
      .string({ error: "Geçersiz fiyat değeri." })
      .max(30, "Fiyat değeri çok uzun.")
      .optional()
      .default(""),
    stock: z
      .string({ error: "Geçersiz stok değeri." })
      .max(30, "Stok değeri çok uzun.")
      .optional()
      .default(""),
    imageUrls: imageListSchema,
    uploads: imageListSchema,
    isHidden: z
      .boolean({ error: "Geçersiz gizlilik değeri." })
      .optional()
      .default(false),
  },
  { error: "Varyant verisi geçersiz." }
);

const variantListSchema = z
  .array(variantSchema, { error: "Varyant verisi geçersiz." })
  .min(1, "En az bir varyant gereklidir.")
  .max(MAX_VARIANTS, `En fazla ${MAX_VARIANTS} varyant eklenebilir.`);

function parsePriceValue(raw: string): ParseResult<number | null> {
  const value = raw.trim().replace(",", ".");
  if (value === "") return { ok: true, value: null };
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Geçersiz fiyat değeri." };
  }
  return { ok: true, value: Math.round(price * 100) / 100 };
}

function parseStockValue(raw: string): ParseResult<number | null> {
  const value = raw.trim();
  if (value === "") return { ok: true, value: null };
  const stock = Number(value);
  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "Stok 0 veya daha büyük bir tam sayı olmalı." };
  }
  return { ok: true, value: stock };
}

export function parseVariantsPayload(
  raw: FormDataEntryValue | null
): ParseResult<ParsedVariant[]> {
  let json: unknown;
  try {
    json = JSON.parse(String(raw ?? "[]"));
  } catch {
    return { ok: false, error: "Varyant verisi okunamadı." };
  }

  const parsed = variantListSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Varyant verisi geçersiz.",
    };
  }

  const variants: ParsedVariant[] = [];
  for (const variant of parsed.data) {
    const name = variant.name.trim() || null;
    if (parsed.data.length > 1 && !name) {
      return {
        ok: false,
        error: "Birden fazla varyantta varyant adı zorunludur.",
      };
    }

    const price = parsePriceValue(variant.price);
    if (!price.ok) return price;

    const stock = parseStockValue(variant.stock);
    if (!stock.ok) return stock;

    for (const url of variant.imageUrls) {
      if (!isValidImageUrl(url, true)) {
        return { ok: false, error: `Geçersiz varyant görsel URL'si: ${url}` };
      }
    }
    for (const url of variant.uploads) {
      if (!isProductImageUrl(url)) {
        return { ok: false, error: "Geçersiz yüklenmiş görsel adresi." };
      }
    }

    const images = dedupeImages([...variant.imageUrls, ...variant.uploads]);
    if (images.length > MAX_IMAGES_PER_VARIANT) {
      return {
        ok: false,
        error: `Bir varyantta en fazla ${MAX_IMAGES_PER_VARIANT} görsel olabilir.`,
      };
    }

    variants.push({
      id: variant.id,
      name,
      price: price.value,
      stock: stock.value,
      images,
      isHidden: variant.isHidden,
    });
  }

  return { ok: true, value: variants };
}

export function parseProductImageInput(
  raw: FormDataEntryValue | null
): ParseResult<string[]> {
  const urls = splitImageUrls(String(raw ?? ""));
  if (urls.length > MAX_PRODUCT_IMAGES) {
    return {
      ok: false,
      error: `En fazla ${MAX_PRODUCT_IMAGES} ürün görseli URL'si girilebilir.`,
    };
  }
  for (const url of urls) {
    if (!isValidImageUrl(url)) {
      return { ok: false, error: `Geçersiz görsel URL'si: ${url}` };
    }
  }
  return { ok: true, value: dedupeImages(urls) };
}
