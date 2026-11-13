import { cacheLife, cacheTag } from "next/cache";
import { getGoogleTagIdSetting, type GoogleTagId } from "./analytics";
import { db, getSetting } from "./db";
import { readCatalogSettings } from "./catalog-settings";
import { firstImage } from "./format";
import {
  clampItemLimit,
  isBannerAspect,
  isBannerLayout,
  isBannerWidth,
  isHomeWidgetType,
  parseHomeWidgetConfig,
} from "./home-widgets";
import { normalizeSearchQuery, toLikePattern } from "./search-fold";
import type {
  Category,
  CategoryNode,
  CategoryOption,
  CategoryTreeItem,
  Collection,
  CollectionProductOption,
  CollectionSummary,
  HomeWidgetBanner,
  HomeWidgetRow,
  HomeWidgetWithBanners,
  MenuItem,
  MenuNavItem,
  Page,
  ProductListItem,
  ProductRow,
  SearchCategoryItem,
  SearchProductItem,
  SearchTypeaheadResult,
  SliderItem,
  VariantRow,
} from "./types";
import { parseVatRate, VAT_RATE_SETTING_KEY } from "./vat";
import type { QuoteContact } from "./quote";
import { readQuoteContact, readSiteContact, type SiteContact } from "./quote-contact";
import type { WhatsAppSupport } from "./whatsapp";
import { readWhatsAppSupport } from "./whatsapp-settings";

export const PAGE_SIZE = 12;

export const PRODUCT_LIST_COLUMNS = `
  p.*,
  (SELECT MIN(v.price) FROM variants v
    WHERE v.product_id = p.id AND v.price IS NOT NULL AND v.active = 1 AND v.is_hidden = 0) AS min_price,
  (SELECT MAX(v.price) FROM variants v
    WHERE v.product_id = p.id AND v.price IS NOT NULL AND v.active = 1 AND v.is_hidden = 0) AS max_price,
  (SELECT COUNT(*) FROM variants v
    WHERE v.product_id = p.id AND v.active = 1 AND v.is_hidden = 0) AS variant_count,
  CASE
    WHEN p.images IS NOT NULL AND p.images <> '[]' THEN p.images
    ELSE (SELECT v.images FROM variants v
      WHERE v.product_id = p.id AND v.active = 1 AND v.is_hidden = 0
        AND v.images <> '[]'
      ORDER BY v.id LIMIT 1)
  END AS first_images
`;

const SEARCH_PRODUCT_COLUMNS = `
  p.id, p.code, p.name, p.slug,
  (SELECT MIN(v.price) FROM variants v
    WHERE v.product_id = p.id AND v.price IS NOT NULL AND v.active = 1 AND v.is_hidden = 0) AS min_price,
  (SELECT MAX(v.price) FROM variants v
    WHERE v.product_id = p.id AND v.price IS NOT NULL AND v.active = 1 AND v.is_hidden = 0) AS max_price,
  CASE
    WHEN p.images IS NOT NULL AND p.images <> '[]' THEN p.images
    ELSE (SELECT v.images FROM variants v
      WHERE v.product_id = p.id AND v.active = 1 AND v.is_hidden = 0
        AND v.images <> '[]'
      ORDER BY v.id LIMIT 1)
  END AS first_images
`;

const PRODUCT_SEARCH_WHERE = `p.active = 1 AND p.is_hidden = 0 AND (
  tr_fold(p.name) LIKE ? ESCAPE '\\' OR tr_fold(p.code) LIKE ? ESCAPE '\\'
)`;

const PRODUCT_SEARCH_WHERE_WITH_TAGS = `p.active = 1 AND p.is_hidden = 0 AND (
  tr_fold(p.name) LIKE ? ESCAPE '\\' OR tr_fold(p.code) LIKE ? ESCAPE '\\'
  OR tr_fold(p.tags) LIKE ? ESCAPE '\\'
)`;

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

const COLLECTION_MEMBERS_CTE = `
  WITH members AS (
    SELECT cp.product_id AS product_id, 0 AS bucket, cp.sort_order AS manual_order
    FROM collection_products cp
    WHERE cp.collection_id = ?
    UNION ALL
    SELECT p.id AS product_id, 1 AS bucket, 0 AS manual_order
    FROM products p
    JOIN collection_categories cc
      ON cc.category_id = p.category_id AND cc.collection_id = ?
    WHERE p.active = 1 AND p.is_hidden = 0
      AND NOT EXISTS (
        SELECT 1 FROM collection_products cp2
        WHERE cp2.collection_id = ? AND cp2.product_id = p.id
      )
  )`;

const COLLECTION_MEMBERS_CTE_WITH_CHILDREN = `
  WITH RECURSIVE collection_category_tree(category_id) AS (
    SELECT cc.category_id
    FROM collection_categories cc
    WHERE cc.collection_id = ?
    UNION
    SELECT c.id
    FROM categories c
    JOIN collection_category_tree t ON c.parent_id = t.category_id
  ),
  members AS (
    SELECT cp.product_id AS product_id, 0 AS bucket, cp.sort_order AS manual_order
    FROM collection_products cp
    WHERE cp.collection_id = ?
    UNION ALL
    SELECT p.id AS product_id, 1 AS bucket, 0 AS manual_order
    FROM products p
    JOIN collection_category_tree t ON t.category_id = p.category_id
    WHERE p.active = 1 AND p.is_hidden = 0
      AND NOT EXISTS (
        SELECT 1 FROM collection_products cp2
        WHERE cp2.collection_id = ? AND cp2.product_id = p.id
      )
  )`;

function collectionMembersCte(includeChildren: boolean): string {
  return includeChildren
    ? COLLECTION_MEMBERS_CTE_WITH_CHILDREN
    : COLLECTION_MEMBERS_CTE;
}

const COLLECTION_MEMBERS_WHERE = `
  FROM products p
  JOIN members m ON m.product_id = p.id
  WHERE p.active = 1 AND p.is_hidden = 0`;

const COLLECTION_MEMBERS_ORDER = `
  ORDER BY m.bucket ASC, m.manual_order ASC, p.id DESC`;

export function mapProductListRow(row: Record<string, unknown>): ProductListItem {
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

function mapSearchProductRow(row: Record<string, unknown>): SearchProductItem {
  return {
    id: row.id as number,
    code: row.code as string,
    name: row.name as string,
    slug: row.slug as string,
    image: firstImage(row.first_images as string | null),
    min_price: (row.min_price as number | null) ?? null,
    max_price: (row.max_price as number | null) ?? null,
  };
}

function fetchCategoryNodes(): CategoryNode[] {
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

export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  return fetchCategoryNodes();
}

export async function getHomeCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const selected: CategoryNode[] = [];

  function collect(nodes: CategoryNode[]): void {
    for (const node of nodes) {
      if (node.show_on_home === 1) selected.push(node);
      collect(node.children);
    }
  }

  collect(fetchCategoryNodes());
  return selected;
}

export async function getCategorySidebarTree(): Promise<{
  nodes: CategoryTreeItem[];
  total: number;
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const rows = db
    .prepare(
      "SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name"
    )
    .all() as Category[];

  const counts = new Map<number, number>();
  const countRows = db
    .prepare(
      `SELECT category_id, COUNT(*) AS total FROM products
       WHERE active = 1 AND is_hidden = 0 AND category_id IS NOT NULL
       GROUP BY category_id`
    )
    .all() as { category_id: number; total: number }[];
  for (const row of countRows) counts.set(row.category_id, row.total);

  const byParent = new Map<number | null, Category[]>();
  for (const row of rows) {
    const list = byParent.get(row.parent_id) ?? [];
    list.push(row);
    byParent.set(row.parent_id, list);
  }

  function build(
    parentId: number | null,
    seen: Set<number>
  ): CategoryTreeItem[] {
    const list = byParent.get(parentId) ?? [];
    return list
      .filter((row) => !seen.has(row.id))
      .map((row) => {
        const nextSeen = new Set(seen).add(row.id);
        const children = build(row.id, nextSeen);
        return {
          ...row,
          children,
          product_count:
            (counts.get(row.id) ?? 0) +
            children.reduce((sum, child) => sum + child.product_count, 0),
        };
      });
  }

  const totalRow = db
    .prepare(
      "SELECT COUNT(*) AS total FROM products WHERE active = 1 AND is_hidden = 0"
    )
    .get() as { total: number };

  return { nodes: build(null, new Set()), total: totalRow.total };
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

export async function getHeaderCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  return readCatalogSettings();
}

export async function getSiteLogoUrl(): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const url = getSetting("logo_url");
  return url && url.trim() ? url.trim() : null;
}

export async function getGoogleTagId(): Promise<GoogleTagId | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  return getGoogleTagIdSetting();
}

export async function getWhatsAppSupport(): Promise<WhatsAppSupport> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  return readWhatsAppSupport();
}

export async function getQuoteContact(): Promise<QuoteContact> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  return readQuoteContact();
}

export async function getSiteContact(): Promise<SiteContact> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  return readSiteContact();
}

export function getVatRate(): number {
  return parseVatRate(getSetting(VAT_RATE_SETTING_KEY));
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

export async function getProductListItemById(
  id: number
): Promise<ProductListItem | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const row = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND p.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapProductListRow(row) : null;
}

export async function getSimilarProducts(
  productId: number,
  categoryId: number,
  limit = 12
): Promise<ProductListItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  // Kök kategorilerde parent_id NULL olduğundan alt cümle NULL döner ve
  // `c.parent_id = NULL` hiçbir satırı eşleştirmez; sadece kendi kategorisi kalır.
  const categoryRows = db
    .prepare(
      `SELECT c.id FROM categories c
       WHERE c.active = 1 AND (
         c.id = ?
         OR c.parent_id = (SELECT parent_id FROM categories WHERE id = ?)
       )`
    )
    .all(categoryId, categoryId) as { id: number }[];

  if (categoryRows.length === 0) return [];
  const categoryIds = categoryRows.map((row) => row.id);
  const placeholders = categoryIds.map(() => "?").join(", ");

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND p.id <> ?
         AND p.category_id IN (${placeholders})
       ORDER BY (p.category_id = ?) DESC, p.is_featured DESC, p.id DESC
       LIMIT ?`
    )
    .all(productId, ...categoryIds, categoryId, limit) as Record<
    string,
    unknown
  >[];

  return rows.map(mapProductListRow);
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

  const trimmed = normalizeSearchQuery(query);
  if (trimmed.length < 2) {
    return { items: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  }

  const pattern = toLikePattern(trimmed);
  const page = normalizePage(options.page);
  const offset = (page - 1) * PAGE_SIZE;

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS total FROM products p WHERE ${PRODUCT_SEARCH_WHERE_WITH_TAGS}`
    )
    .get(pattern, pattern, pattern) as { total: number };

  const rows = db
    .prepare(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       WHERE ${PRODUCT_SEARCH_WHERE_WITH_TAGS}
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

export async function searchTypeahead(
  query: string,
  options: { productLimit?: number } = {}
): Promise<SearchTypeaheadResult> {
  const trimmed = normalizeSearchQuery(query);
  if (trimmed.length < 2) {
    return { query: trimmed, products: [], productTotal: 0, categories: [] };
  }

  const pattern = toLikePattern(trimmed);
  const productLimit = Math.min(
    Math.max(Math.floor(options.productLimit ?? 8), 1),
    12
  );

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS total FROM products p WHERE ${PRODUCT_SEARCH_WHERE}`
    )
    .get(pattern, pattern) as { total: number };

  const productRows = db
    .prepare(
      `SELECT ${SEARCH_PRODUCT_COLUMNS}
       FROM products p
       WHERE ${PRODUCT_SEARCH_WHERE}
       ORDER BY p.is_featured DESC, p.id DESC
       LIMIT ?`
    )
    .all(pattern, pattern, productLimit) as Record<string, unknown>[];

  const categories = db
    .prepare(
      `SELECT c.id, c.name, c.slug, parent.name AS parent_name
       FROM categories c
       LEFT JOIN categories parent ON parent.id = c.parent_id AND parent.active = 1
       WHERE c.active = 1 AND (
         tr_fold(c.name) LIKE ? ESCAPE '\\' OR tr_fold(c.slug) LIKE ? ESCAPE '\\'
       )
       ORDER BY (parent.id IS NULL) DESC, c.sort_order, c.name`
    )
    .all(pattern, pattern) as SearchCategoryItem[];

  return {
    query: trimmed,
    products: productRows.map(mapSearchProductRow),
    productTotal: totalRow.total,
    categories,
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

export function fetchHomeWidgets(
  options: { activeOnly?: boolean } = {}
): HomeWidgetWithBanners[] {
  const activeOnly = options.activeOnly ?? false;

  const rows = db
    .prepare(
      `SELECT * FROM home_widgets${activeOnly ? " WHERE active = 1" : ""}
       ORDER BY sort_order, id`
    )
    .all() as HomeWidgetRow[];

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const banners = db
    .prepare(
      `SELECT * FROM home_widget_banners
       WHERE widget_id IN (${placeholders})${activeOnly ? " AND active = 1" : ""}
       ORDER BY sort_order, id`
    )
    .all(...ids) as HomeWidgetBanner[];

  const grouped = new Map<number, HomeWidgetBanner[]>();
  for (const banner of banners) {
    const list = grouped.get(banner.widget_id);
    if (list) list.push(banner);
    else grouped.set(banner.widget_id, [banner]);
  }

  const widgets: HomeWidgetWithBanners[] = [];
  for (const row of rows) {
    if (!isHomeWidgetType(row.type)) continue;
    widgets.push({
      ...row,
      type: row.type,
      banner_layout: isBannerLayout(row.banner_layout)
        ? row.banner_layout
        : 1,
      aspect: isBannerAspect(row.aspect) ? row.aspect : "wide",
      banner_width: isBannerWidth(row.banner_width)
        ? row.banner_width
        : "container",
      item_limit: clampItemLimit(row.item_limit, 0, 0, 24),
      config: parseHomeWidgetConfig(row.config),
      banners: grouped.get(row.id) ?? [],
    });
  }

  return widgets;
}

export async function getHomeWidgets(): Promise<HomeWidgetWithBanners[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("homepage");

  return fetchHomeWidgets({ activeOnly: true });
}

export async function getCollectionBySlug(
  slug: string
): Promise<Collection | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("collections", "catalog");

  const row = db
    .prepare("SELECT * FROM collections WHERE slug = ? AND active = 1")
    .get(slug) as Collection | undefined;
  return row ?? null;
}

export async function getCollectionProductsBySlug(
  slug: string,
  options: { page?: number } = {}
): Promise<{
  collection: Collection;
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("collections", "catalog");

  const collection = db
    .prepare("SELECT * FROM collections WHERE slug = ? AND active = 1")
    .get(slug) as Collection | undefined;
  if (!collection) return null;

  const page = normalizePage(options.page);
  const offset = (page - 1) * PAGE_SIZE;
  const membersCte = collectionMembersCte(collection.include_children === 1);

  const totalRow = db
    .prepare(
      `${membersCte}
       SELECT COUNT(*) AS total ${COLLECTION_MEMBERS_WHERE}`
    )
    .get(collection.id, collection.id, collection.id) as { total: number };

  const rows = db
    .prepare(
      `${membersCte}
       SELECT ${PRODUCT_LIST_COLUMNS} ${COLLECTION_MEMBERS_WHERE}
       ${COLLECTION_MEMBERS_ORDER}
       LIMIT ? OFFSET ?`
    )
    .all(
      collection.id,
      collection.id,
      collection.id,
      PAGE_SIZE,
      offset
    ) as Record<string, unknown>[];

  return {
    collection,
    items: rows.map(mapProductListRow),
    total: totalRow.total,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getCollectionWidgetProducts(
  collectionId: number,
  limit: number
): Promise<{ collection: Collection; items: ProductListItem[] } | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("collections", "catalog");

  const collection = db
    .prepare("SELECT * FROM collections WHERE id = ? AND active = 1")
    .get(collectionId) as Collection | undefined;
  if (!collection) return null;

  const safeLimit = Math.max(1, Math.min(48, Math.trunc(limit) || 20));
  const rows = db
    .prepare(
      `${collectionMembersCte(collection.include_children === 1)}
       SELECT ${PRODUCT_LIST_COLUMNS} ${COLLECTION_MEMBERS_WHERE}
       ${COLLECTION_MEMBERS_ORDER}
       LIMIT ?`
    )
    .all(
      collection.id,
      collection.id,
      collection.id,
      safeLimit
    ) as Record<string, unknown>[];

  return { collection, items: rows.map(mapProductListRow) };
}

export function fetchCollections(): CollectionSummary[] {
  return db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM collection_products cp
          WHERE cp.collection_id = c.id) AS manual_count,
        (SELECT COUNT(*) FROM collection_categories cc
          WHERE cc.collection_id = c.id) AS category_count
       FROM collections c
       ORDER BY c.name COLLATE NOCASE`
    )
    .all() as CollectionSummary[];
}

export function fetchCollectionOptions(): Collection[] {
  return db
    .prepare(
      "SELECT * FROM collections ORDER BY active DESC, name COLLATE NOCASE"
    )
    .all() as Collection[];
}

export function fetchCollectionEditorData(
  collectionId: number
): {
  collection: Collection;
  products: CollectionProductOption[];
  categoryIds: number[];
} | null {
  const collection = db
    .prepare("SELECT * FROM collections WHERE id = ?")
    .get(collectionId) as Collection | undefined;
  if (!collection) return null;

  const products = db
    .prepare(
      `SELECT p.id, p.code, p.name, p.slug
       FROM collection_products cp
       JOIN products p ON p.id = cp.product_id
       WHERE cp.collection_id = ?
       ORDER BY cp.sort_order, p.id`
    )
    .all(collectionId) as CollectionProductOption[];

  const categories = db
    .prepare(
      "SELECT category_id FROM collection_categories WHERE collection_id = ? ORDER BY category_id"
    )
    .all(collectionId) as { category_id: number }[];

  return {
    collection,
    products,
    categoryIds: categories.map((row) => row.category_id),
  };
}

export function fetchAdminCategoryOptions(): CategoryOption[] {
  return db
    .prepare(
      `SELECT id, name, parent_id, active, sort_order
       FROM categories
       ORDER BY sort_order, name COLLATE NOCASE`
    )
    .all() as CategoryOption[];
}

export async function getCategoryCardImage(
  categoryIds: number[]
): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  if (categoryIds.length === 0) return null;
  const placeholders = categoryIds.map(() => "?").join(", ");

  const productRow = db
    .prepare(
      `SELECT p.images FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0
         AND p.category_id IN (${placeholders})
         AND p.images IS NOT NULL AND p.images <> '[]'
       ORDER BY p.is_featured DESC, p.id DESC LIMIT 1`
    )
    .get(...categoryIds) as { images: string } | undefined;
  const productImage = firstImage(productRow?.images);
  if (productImage) return productImage;

  const row = db
    .prepare(
      `SELECT v.images FROM variants v
       JOIN products p ON p.id = v.product_id
       WHERE p.active = 1 AND p.is_hidden = 0 AND v.active = 1 AND v.is_hidden = 0
         AND v.images <> '[]'
         AND p.category_id IN (${placeholders})
       ORDER BY p.is_featured DESC, p.id DESC LIMIT 1`
    )
    .get(...categoryIds) as { images: string } | undefined;

  return firstImage(row?.images);
}
