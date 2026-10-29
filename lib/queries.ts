import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";
import type {
  Category,
  CategoryNode,
  MenuItem,
  MenuNavItem,
  Page,
  ProductListItem,
  ProductRow,
  SliderItem,
  VariantRow,
} from "./types";

export const PAGE_SIZE = 12;

const PRODUCT_LIST_COLUMNS = `
  p.*,
  (SELECT MIN(v.price) FROM variants v
    WHERE v.product_id = p.id AND v.price IS NOT NULL AND v.active = 1 AND v.is_hidden = 0) AS min_price,
  (SELECT MAX(v.price) FROM variants v
    WHERE v.product_id = p.id AND v.price IS NOT NULL AND v.active = 1 AND v.is_hidden = 0) AS max_price,
  (SELECT COUNT(*) FROM variants v
    WHERE v.product_id = p.id AND v.active = 1 AND v.is_hidden = 0) AS variant_count,
  (SELECT v.images FROM variants v
    WHERE v.product_id = p.id AND v.active = 1 AND v.is_hidden = 0
    ORDER BY v.id LIMIT 1) AS first_images
`;

const SORT_OPTIONS: Record<string, string> = {
  newest: "p.id DESC",
  name: "p.name COLLATE NOCASE ASC",
  price_asc: "min_price IS NULL, min_price ASC",
  price_desc: "min_price IS NULL, min_price DESC",
};

function normalizeSort(sort: string | undefined): string {
  if (sort && sort in SORT_OPTIONS) return sort;
  return "newest";
}

function normalizePage(page: number | undefined): number {
  if (!page || !Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function mapProductListRow(row: Record<string, unknown>): ProductListItem {
  const firstImages = row.first_images as string | null;
  let image: string | null = null;
  if (firstImages) {
    try {
      const parsed = JSON.parse(firstImages) as unknown;
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        image = parsed[0];
      }
    } catch {
      image = null;
    }
  }
  return {
    ...(row as unknown as ProductRow),
    image,
    min_price: (row.min_price as number | null) ?? null,
    max_price: (row.max_price as number | null) ?? null,
    variant_count: (row.variant_count as number) ?? 0,
  };
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const rows = db
    .prepare(
      "SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name"
    )
    .all() as Category[];

  const byParent = new Map<number | null, Category[]>();
  for (const row of rows) {
    const list = byParent.get(row.parent_id) ?? [];
    list.push(row);
    byParent.set(row.parent_id, list);
  }

  function build(parentId: number | null, seen: Set<number>): CategoryNode[] {
    const list = byParent.get(parentId) ?? [];
    return list
      .filter((row) => !seen.has(row.id))
      .map((row) => {
        const nextSeen = new Set(seen).add(row.id);
        return { ...row, children: build(row.id, nextSeen) };
      });
  }

  return build(null, new Set());
}

export async function getMenuNavItems(): Promise<MenuNavItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu");

  const rows = db
    .prepare(
      `SELECT m.*, p.slug AS page_slug, p.active AS page_active
       FROM menu_items m
       LEFT JOIN pages p ON p.id = m.page_id
       WHERE m.active = 1
       ORDER BY m.sort_order, m.id`
    )
    .all() as (MenuItem & {
    page_slug: string | null;
    page_active: number | null;
  })[];

  const items: MenuNavItem[] = [];
  for (const row of rows) {
    let href: string | null = null;
    if (row.type === "categories") {
      href = "/urunler";
    } else if (row.type === "page") {
      if (!row.page_slug || row.page_active !== 1) continue;
      href = `/${row.page_slug}`;
    } else if (row.type === "link") {
      href = row.href?.trim() || null;
    }

    if (!href) continue;
    items.push({
      id: row.id,
      label: row.label,
      type: row.type,
      href,
      open_in_new_tab: row.open_in_new_tab === 1,
    });
  }

  return items;
}

export async function getPublishedPageBySlug(
  slug: string
): Promise<Page | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");

  const row = db
    .prepare("SELECT * FROM pages WHERE slug = ? AND active = 1")
    .get(slug) as Page | undefined;

  return row ?? null;
}

export async function getMenuItemsCount(): Promise<number> {
  "use cache";
  cacheLife("hours");
  cacheTag("menu");

  const row = db.prepare("SELECT COUNT(*) AS total FROM menu_items").get() as {
    total: number;
  };

  return row.total;
}

export async function getAllProducts(
  options: { page?: number; sort?: string } = {}
): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const page = normalizePage(options.page);
  const orderBy = SORT_OPTIONS[normalizeSort(options.sort)];
  const offset = (page - 1) * PAGE_SIZE;

  const totalRow = db
    .prepare(
      "SELECT COUNT(*) AS total FROM products p WHERE p.active = 1 AND p.is_hidden = 0"
    )
    .get() as { total: number };

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
    )
    .all(PAGE_SIZE, offset) as Record<string, unknown>[];

  return {
    items: rows.map(mapProductListRow),
    total: totalRow.total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getCategoryBySlug(slug: string): Promise<{
  category: Category;
  parent: Category | null;
  children: Category[];
} | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const category = db
    .prepare("SELECT * FROM categories WHERE slug = ? AND active = 1")
    .get(slug) as Category | undefined;
  if (!category) return null;

  const parent = category.parent_id
    ? ((db
        .prepare("SELECT * FROM categories WHERE id = ?")
        .get(category.parent_id) as Category | undefined) ?? null)
    : null;

  const children = db
    .prepare(
      "SELECT * FROM categories WHERE parent_id = ? AND active = 1 ORDER BY sort_order, name"
    )
    .all(category.id) as Category[];

  return { category, parent, children };
}

export async function getProductsByCategorySlug(
  slug: string,
  options: { page?: number; sort?: string } = {}
): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const category = db
    .prepare("SELECT * FROM categories WHERE slug = ? AND active = 1")
    .get(slug) as Category | undefined;
  if (!category) return null;

  const children = db
    .prepare("SELECT id FROM categories WHERE parent_id = ? AND active = 1")
    .all(category.id) as { id: number }[];
  const categoryIds = [category.id, ...children.map((child) => child.id)];
  const placeholders = categoryIds.map(() => "?").join(", ");

  const sort = normalizeSort(options.sort);
  const page = normalizePage(options.page);
  const offset = (page - 1) * PAGE_SIZE;

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS total FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND p.category_id IN (${placeholders})`
    )
    .get(...categoryIds) as { total: number };

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND p.category_id IN (${placeholders})
       ORDER BY ${SORT_OPTIONS[sort]}
       LIMIT ? OFFSET ?`
    )
    .all(...categoryIds, PAGE_SIZE, offset) as Record<string, unknown>[];

  return {
    items: rows.map(mapProductListRow),
    total: totalRow.total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getProductBySlug(slug: string): Promise<{
  product: ProductRow;
  variants: VariantRow[];
  category: Category | null;
  parent: Category | null;
} | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const product = db
    .prepare(
      "SELECT * FROM products WHERE slug = ? AND active = 1 AND is_hidden = 0"
    )
    .get(slug) as ProductRow | undefined;
  if (!product) return null;

  const variants = db
    .prepare(
      `SELECT * FROM variants
       WHERE product_id = ? AND active = 1 AND is_hidden = 0
       ORDER BY id`
    )
    .all(product.id) as VariantRow[];

  const category = product.category_id
    ? ((db
        .prepare("SELECT * FROM categories WHERE id = ?")
        .get(product.category_id) as Category | undefined) ?? null)
    : null;
  const parent = category?.parent_id
    ? ((db
        .prepare("SELECT * FROM categories WHERE id = ?")
        .get(category.parent_id) as Category | undefined) ?? null)
    : null;

  return { product, variants, category, parent };
}

export async function getFeaturedProducts(
  limit = 8
): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND p.is_featured = 1
       ORDER BY p.id DESC LIMIT ?`
    )
    .all(limit) as Record<string, unknown>[];

  if (rows.length > 0) return rows.map(mapProductListRow);

  const fallback = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0
       ORDER BY p.id DESC LIMIT ?`
    )
    .all(limit) as Record<string, unknown>[];
  return fallback.map(mapProductListRow);
}

export async function getNewProducts(limit = 8): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0
       ORDER BY p.id DESC LIMIT ?`
    )
    .all(limit) as Record<string, unknown>[];
  return rows.map(mapProductListRow);
}

export async function getProductsByCategory(
  categoryIds: number[],
  limit: number
): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  if (categoryIds.length === 0) return [];
  const placeholders = categoryIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND p.category_id IN (${placeholders})
       ORDER BY p.is_featured DESC, p.id DESC LIMIT ?`
    )
    .all(...categoryIds, limit) as Record<string, unknown>[];
  return rows.map(mapProductListRow);
}

export async function searchProducts(
  query: string,
  options: { page?: number } = {}
): Promise<{
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { items: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  }

  const escaped = trimmed.replace(/[%_\\]/g, "\\$&");
  const pattern = `%${escaped}%`;
  const page = normalizePage(options.page);
  const offset = (page - 1) * PAGE_SIZE;

  const where = `p.active = 1 AND p.is_hidden = 0 AND (
    p.name LIKE ? ESCAPE '\\' OR p.code LIKE ? ESCAPE '\\' OR p.tags LIKE ? ESCAPE '\\'
  )`;

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM products p WHERE ${where}`)
    .get(pattern, pattern, pattern) as { total: number };

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE ${where}
       ORDER BY p.is_featured DESC, p.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(pattern, pattern, pattern, PAGE_SIZE, offset) as Record<
    string,
    unknown
  >[];

  return {
    items: rows.map(mapProductListRow),
    total: totalRow.total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getSliderItems(): Promise<SliderItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("slider");

  return db
    .prepare(
      "SELECT * FROM slider WHERE active = 1 ORDER BY sort_order, id LIMIT 8"
    )
    .all() as SliderItem[];
}

export async function getCategoryCardImage(
  categoryIds: number[]
): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  if (categoryIds.length === 0) return null;
  const placeholders = categoryIds.map(() => "?").join(", ");
  const row = db
    .prepare(
      `SELECT v.images FROM variants v
       JOIN products p ON p.id = v.product_id
       WHERE p.active = 1 AND p.is_hidden = 0 AND v.active = 1 AND v.is_hidden = 0
         AND p.category_id IN (${placeholders})
       ORDER BY p.is_featured DESC, p.id DESC LIMIT 1`
    )
    .get(...categoryIds) as { images: string } | undefined;

  if (!row) return null;
  try {
    const parsed = JSON.parse(row.images) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
  } catch {
    return null;
  }
  return null;
}
