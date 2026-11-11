import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  PRODUCT_IMAGE_PREFIX,
  isProductImageUrl,
  isRemoteImageUrl,
} from "./image-urls";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

export const UPLOAD_ROOT = path.join(
  process.cwd(),
  /* turbopackIgnore: true */ "public",
  "uploads"
);

type UploadBucket = {
  dir: string;
  prefix: string;
};

const SLIDER_BUCKET: UploadBucket = {
  dir: path.join(UPLOAD_ROOT, "slider"),
  prefix: "/uploads/slider/",
};

const CATEGORY_BUCKET: UploadBucket = {
  dir: path.join(UPLOAD_ROOT, "categories"),
  prefix: "/uploads/categories/",
};

const LOGO_BUCKET: UploadBucket = {
  dir: path.join(UPLOAD_ROOT, "logo"),
  prefix: "/uploads/logo/",
};

const BANNER_BUCKET: UploadBucket = {
  dir: path.join(UPLOAD_ROOT, "banners"),
  prefix: "/uploads/banners/",
};

const CONTENT_BUCKET: UploadBucket = {
  dir: path.join(UPLOAD_ROOT, "content"),
  prefix: "/uploads/content/",
};

const PRODUCT_BUCKET: UploadBucket = {
  dir: path.join(UPLOAD_ROOT, "products"),
  prefix: PRODUCT_IMAGE_PREFIX,
};

async function optimizeImage(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("Görsel işlenemedi. JPEG, PNG veya WEBP deneyin.");
  }
}

async function saveImage(file: File, bucket: UploadBucket): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Lütfen bir görsel seçin.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel 5 MB'dan büyük olamaz.");
  }

  const extension = IMAGE_EXTENSIONS.get(file.type);
  if (!extension) {
    throw new Error("Desteklenmeyen görsel formatı (JPEG, PNG, WEBP, GIF, AVIF).");
  }

  await mkdir(bucket.dir, { recursive: true });

  const name = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(bucket.dir, name), buffer);

  return `${bucket.prefix}${name}`;
}

async function deleteImage(
  url: string | null,
  bucket: UploadBucket
): Promise<void> {
  if (!url?.startsWith(bucket.prefix)) return;

  const file = path.basename(url);
  if (!file) return;

  await unlink(path.join(bucket.dir, file)).catch(() => undefined);
}

export function saveSliderImage(file: File): Promise<string> {
  return saveImage(file, SLIDER_BUCKET);
}

export function deleteSliderImage(url: string | null): Promise<void> {
  return deleteImage(url, SLIDER_BUCKET);
}

async function writeCategoryImage(input: Buffer): Promise<string> {
  const output = await optimizeImage(input);
  await mkdir(CATEGORY_BUCKET.dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(CATEGORY_BUCKET.dir, name), output);
  return `${CATEGORY_BUCKET.prefix}${name}`;
}

export async function saveCategoryImage(file: File): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Lütfen bir görsel seçin.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel 5 MB'dan büyük olamaz.");
  }
  if (!IMAGE_EXTENSIONS.has(file.type)) {
    throw new Error("Desteklenmeyen görsel formatı (JPEG, PNG, WEBP, GIF, AVIF).");
  }
  return writeCategoryImage(Buffer.from(await file.arrayBuffer()));
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  if (
    host === "::" ||
    host === "::1" ||
    /^(fc|fd)/.test(host) ||
    host.startsWith("fe80:")
  ) {
    return true;
  }
  return (
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === "0.0.0.0"
  );
}

async function readImageBody(response: Response): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Görsel indirilemedi.");
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error("Görsel 5 MB'dan büyük olamaz.");
    }
    chunks.push(Buffer.from(value));
  }
  if (total === 0) throw new Error("Görsel indirilemedi.");
  return Buffer.concat(chunks);
}

export async function saveCategoryImageFromUrl(rawUrl: string): Promise<string> {
  let url = rawUrl.trim();
  if (url.length > 2048 || !isRemoteImageUrl(url)) {
    throw new Error("Geçerli bir http(s) görsel adresi girin.");
  }

  // Yönlendirmeler dahili bir adrese gidebileceği için her hop yeniden doğrulanır.
  for (let hop = 0; hop < 4; hop += 1) {
    if (!isRemoteImageUrl(url)) {
      throw new Error("Geçerli bir http(s) görsel adresi girin.");
    }
    if (isPrivateHost(new URL(url).hostname)) {
      throw new Error("Dahili ağ adreslerinden görsel indirilemez.");
    }
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: "image/*" },
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new Error("Görsel indirilemedi. Adresi kontrol edin.");
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Görsel indirilemedi.");
      url = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) {
      throw new Error(`Görsel indirilemedi (HTTP ${response.status}).`);
    }
    return writeCategoryImage(await readImageBody(response));
  }
  throw new Error("Görsel indirilemedi: çok fazla yönlendirme.");
}

export function deleteCategoryImage(url: string | null): Promise<void> {
  return deleteImage(url, CATEGORY_BUCKET);
}

export function saveLogoImage(file: File): Promise<string> {
  return saveImage(file, LOGO_BUCKET);
}

export function deleteLogoImage(url: string | null): Promise<void> {
  return deleteImage(url, LOGO_BUCKET);
}

export function saveHomeBannerImage(file: File): Promise<string> {
  return saveImage(file, BANNER_BUCKET);
}

export function deleteHomeBannerImage(url: string | null): Promise<void> {
  return deleteImage(url, BANNER_BUCKET);
}

export function saveContentImage(file: File): Promise<string> {
  return saveImage(file, CONTENT_BUCKET);
}

export async function saveProductImage(file: File): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Lütfen bir görsel seçin.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel 5 MB'dan büyük olamaz.");
  }
  if (!IMAGE_EXTENSIONS.has(file.type)) {
    throw new Error("Desteklenmeyen görsel formatı (JPEG, PNG, WEBP, GIF, AVIF).");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const output = await optimizeImage(input);

  await mkdir(PRODUCT_BUCKET.dir, { recursive: true });
  const name = `${randomUUID()}.webp`;
  await writeFile(path.join(PRODUCT_BUCKET.dir, name), output);
  return `${PRODUCT_BUCKET.prefix}${name}`;
}

export async function deleteProductImage(url: string | null): Promise<void> {
  if (!url || !isProductImageUrl(url)) return;
  await unlink(path.join(PRODUCT_BUCKET.dir, path.basename(url))).catch(
    () => undefined
  );
}
