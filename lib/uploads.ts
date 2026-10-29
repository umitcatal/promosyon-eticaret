import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

const UPLOAD_ROOT = path.join(
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

export function saveCategoryImage(file: File): Promise<string> {
  return saveImage(file, CATEGORY_BUCKET);
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
