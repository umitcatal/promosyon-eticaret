import { db } from "./db";
import { mapProductListRow, PRODUCT_LIST_COLUMNS } from "./queries";
import type { ProductListItem } from "./types";

export function getFavoriteIds(userId: number): number[] {
  const rows = db
    .prepare(
      `SELECT f.product_id
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       WHERE f.user_id = ? AND p.active = 1 AND p.is_hidden = 0
       ORDER BY f.id DESC`
    )
    .all(userId) as { product_id: number }[];
  return rows.map((row) => row.product_id);
}

export function setFavorite(
  userId: number,
  productId: number,
  favorite: boolean
): void {
  if (favorite) {
    db.prepare(
      `INSERT INTO favorites (user_id, product_id)
       VALUES (?, ?)
       ON CONFLICT(user_id, product_id) DO NOTHING`
    ).run(userId, productId);
    return;
  }

  db.prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?").run(
    userId,
    productId
  );
}

export function countFavorites(userId: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       WHERE f.user_id = ? AND p.active = 1 AND p.is_hidden = 0`
    )
    .get(userId) as { total: number };
  return row.total;
}

export function getFavoriteProducts(userId: number): ProductListItem[] {
  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       JOIN favorites f ON f.product_id = p.id
       WHERE f.user_id = ? AND p.active = 1 AND p.is_hidden = 0
       ORDER BY f.id DESC`
    )
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapProductListRow);
}
