import { db } from "./db";

function firstImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) return null;
  for (const item of parsed) {
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return null;
}

export function backfillCategoryImages(): number {
  const candidateRows = db
    .prepare(
      `SELECT p.category_id AS category_id, v.images AS images
       FROM products p
       JOIN variants v ON v.product_id = p.id
       WHERE p.active = 1 AND p.is_hidden = 0
         AND v.active = 1 AND v.is_hidden = 0
         AND p.category_id IS NOT NULL
       ORDER BY p.is_featured DESC, p.id DESC, v.id ASC`
    )
    .all() as { category_id: number; images: string | null }[];

  const ownImage = new Map<number, string>();
  for (const row of candidateRows) {
    if (ownImage.has(row.category_id)) continue;
    const url = firstImageUrl(row.images);
    if (url) ownImage.set(row.category_id, url);
  }

  const categories = db
    .prepare(
      "SELECT id, parent_id, image_url FROM categories WHERE active = 1 ORDER BY sort_order, name"
    )
    .all() as { id: number; parent_id: number | null; image_url: string | null }[];

  const childIds = new Map<number, number[]>();
  for (const category of categories) {
    if (category.parent_id === null) continue;
    const list = childIds.get(category.parent_id) ?? [];
    list.push(category.id);
    childIds.set(category.parent_id, list);
  }

  const inherited = new Map<number, string>(ownImage);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (inherited.has(category.id)) continue;
      for (const childId of childIds.get(category.id) ?? []) {
        const url = inherited.get(childId);
        if (url) {
          inherited.set(category.id, url);
          changed = true;
          break;
        }
      }
    }
  }

  const updateImage = db.prepare(
    `UPDATE categories SET image_url = ?
     WHERE id = ? AND (image_url IS NULL OR TRIM(image_url) = '')`
  );

  const run = db.transaction(() => {
    let filled = 0;
    for (const category of categories) {
      if (category.image_url?.trim()) continue;
      const url = inherited.get(category.id);
      if (!url) continue;
      filled += updateImage.run(url, category.id).changes;
    }
    return filled;
  });

  return run();
}
