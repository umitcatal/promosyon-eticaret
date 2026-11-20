export function splitReferencesIntoRows<T>(items: T[], rows: number): T[][] {
  const count = items.length;
  if (count === 0) return [];

  const rowCount = Math.min(Math.max(1, Math.trunc(rows)), count);
  if (rowCount === 1) return [items];

  const base = Math.floor(count / rowCount);
  const extra = count % rowCount;
  const result: T[][] = [];
  let index = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const size = base + (row < extra ? 1 : 0);
    result.push(items.slice(index, index + size));
    index += size;
  }

  return result;
}

export const MARQUEE_MIN_ITEMS = 8;

export function marqueeCopies(itemCount: number): number {
  if (itemCount <= 0) return 1;
  return Math.max(1, Math.ceil(MARQUEE_MIN_ITEMS / itemCount));
}
