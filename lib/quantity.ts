export const MAX_QUANTITY_PER_ITEM = 99999;

export const MAX_QUANTITY_DIGITS = String(MAX_QUANTITY_PER_ITEM).length;

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.trunc(value)));
}
