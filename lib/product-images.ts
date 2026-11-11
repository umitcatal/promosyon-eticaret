import { db } from "./db";
import { isProductImageUrl } from "./image-urls";
import { deleteProductImage } from "./uploads";

export function isImageReferenced(url: string): boolean {
  if (!isProductImageUrl(url)) return false;
  const row = db
    .prepare("SELECT 1 AS found FROM variants WHERE instr(images, ?) > 0 LIMIT 1")
    .get(url);
  return Boolean(row);
}

export async function deleteUnreferencedProductImages(
  urls: string[]
): Promise<void> {
  const unique = [...new Set(urls)].filter(isProductImageUrl);
  if (unique.length === 0) return;

  const findReference = db.prepare(
    "SELECT 1 AS found FROM variants WHERE instr(images, ?) > 0 LIMIT 1"
  );
  for (const url of unique) {
    if (findReference.get(url)) continue;
    await deleteProductImage(url);
  }
}
