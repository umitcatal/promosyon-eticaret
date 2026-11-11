import { db } from "./db";

export const MANUAL_ID_BASE = 1_000_000_000;

export function isManualId(id: number): boolean {
  return Number.isInteger(id) && id >= MANUAL_ID_BASE;
}

export function nextManualId(table: "products" | "variants"): number {
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(id), ${MANUAL_ID_BASE - 1}) AS maxId
       FROM ${table}
       WHERE id >= ${MANUAL_ID_BASE}`
    )
    .get() as { maxId: number };
  return row.maxId + 1;
}
