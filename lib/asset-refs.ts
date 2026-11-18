import { db } from "./db";

/**
 * Sites cloned from each other share the same `/uploads/...` files. Before a
 * physical delete we check every table that can point at an uploaded asset so
 * removing media on one site never breaks the other.
 */
const REFERENCE_CHECKS = [
  "SELECT 1 AS found FROM site_settings WHERE instr(value, ?) > 0 LIMIT 1",
  "SELECT 1 AS found FROM slider WHERE image_url = ? LIMIT 1",
  "SELECT 1 AS found FROM home_widget_banners WHERE image_url = ? LIMIT 1",
  "SELECT 1 AS found FROM categories WHERE image_url = ? LIMIT 1",
  "SELECT 1 AS found FROM pages WHERE instr(content, ?) > 0 LIMIT 1",
  "SELECT 1 AS found FROM variants WHERE instr(images, ?) > 0 LIMIT 1",
];

export function isAssetReferenced(url: string): boolean {
  const value = url.trim();
  if (!value) return false;

  return REFERENCE_CHECKS.some((sql) =>
    Boolean(db.prepare(sql).get(value))
  );
}
