import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {
  DEFAULT_CAROUSEL_STYLE,
  DEFAULT_PROCESS_STEPS,
  HOME_WIDGET_META,
} from "./home-widgets";
import { foldTr } from "./search-fold";

const dbPath =
  process.env.DB_PATH ?? path.join(process.cwd(), "data", "promosyon.db");

fs.mkdirSync(
  path.dirname(path.resolve(/* turbopackIgnore: true */ dbPath)),
  { recursive: true }
);

const globalForDb = globalThis as unknown as {
  __promosyonDb?: Database.Database;
};

export const db = globalForDb.__promosyonDb ?? new Database(dbPath);

globalForDb.__promosyonDb = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.function("tr_fold", { deterministic: true }, foldTr);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    show_on_home INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(parent_id, slug)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    tags TEXT,
    baski_fiyatlari TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

  CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attr_group TEXT,
    attr_name TEXT,
    images TEXT NOT NULL DEFAULT '[]',
    price REAL,
    net_price REAL,
    discount REAL,
    stock INTEGER,
    price_updated_at TEXT,
    price_source TEXT,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    idempotency_key TEXT,
    status TEXT NOT NULL DEFAULT 'yeni',
    note TEXT,
    total REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    product_code TEXT,
    unit_price REAL,
    quantity INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS slider (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    link TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    meta_title TEXT,
    meta_description TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'link',
    href TEXT,
    page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
    open_in_new_tab INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_menu_items_order ON menu_items(sort_order, id);

  CREATE TABLE IF NOT EXISTS home_widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    eyebrow TEXT,
    title TEXT,
    subtitle TEXT,
    link TEXT,
    link_label TEXT,
    banner_layout INTEGER NOT NULL DEFAULT 1,
    aspect TEXT NOT NULL DEFAULT 'wide',
    banner_width TEXT NOT NULL DEFAULT 'container',
    item_limit INTEGER NOT NULL DEFAULT 0,
    config TEXT NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_home_widgets_order
  ON home_widgets(sort_order, id);

  CREATE TABLE IF NOT EXISTS home_widget_banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    widget_id INTEGER NOT NULL REFERENCES home_widgets(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    link TEXT,
    open_in_new_tab INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_home_widget_banners_widget
  ON home_widget_banners(widget_id, sort_order, id);

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    include_children INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(active);

  CREATE TABLE IF NOT EXISTS collection_products (
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, product_id)
  ) WITHOUT ROWID;
  CREATE INDEX IF NOT EXISTS idx_collection_products_order
  ON collection_products(collection_id, sort_order, product_id);

  CREATE TABLE IF NOT EXISTS collection_categories (
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, category_id)
  ) WITHOUT ROWID;
  CREATE INDEX IF NOT EXISTS idx_collection_categories_category
  ON collection_categories(category_id);
`);

function ensureColumn(
  table:
    | "categories"
    | "collections"
    | "home_widgets"
    | "orders"
    | "products"
    | "variants",
  column: string,
  definition: string
): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  if (columns.some((info) => info.name === column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

const addedShowOnHome = ensureColumn(
  "categories",
  "show_on_home",
  "INTEGER NOT NULL DEFAULT 0"
);
if (addedShowOnHome) {
  db.exec(`
    UPDATE categories SET show_on_home = 1
    WHERE id IN (
      SELECT id FROM categories
      WHERE parent_id IS NULL AND active = 1
      ORDER BY sort_order, name
      LIMIT 8
    )
  `);
}
ensureColumn(
  "collections",
  "include_children",
  "INTEGER NOT NULL DEFAULT 0"
);
ensureColumn("products", "baski_fiyatlari", "TEXT");
ensureColumn("variants", "net_price", "REAL");
ensureColumn("variants", "discount", "REAL");
ensureColumn("variants", "stock", "INTEGER");
ensureColumn("orders", "idempotency_key", "TEXT");
ensureColumn(
  "home_widgets",
  "banner_width",
  "TEXT NOT NULL DEFAULT 'container'"
);
ensureColumn("products", "meta_title", "TEXT");
ensureColumn("products", "meta_description", "TEXT");
ensureColumn("categories", "meta_title", "TEXT");
ensureColumn("categories", "meta_description", "TEXT");

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency
  ON orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
`);

export function getSetting(key: string): string | null {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

const HOME_WIDGETS_SEED_KEY = "home_widgets_seeded";
const RECENTLY_VIEWED_WIDGET_SEED_KEY = "recently_viewed_widget_seeded";

function insertRecentlyViewedWidget(sortOrder: number): void {
  const defaults = HOME_WIDGET_META.recently_viewed.defaults;

  db.prepare(
    `INSERT INTO home_widgets
       (type, eyebrow, title, subtitle, link, link_label, banner_layout, aspect, item_limit, config, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    "recently_viewed",
    defaults.eyebrow,
    defaults.title,
    defaults.subtitle,
    defaults.link,
    defaults.link_label,
    1,
    "wide",
    defaults.item_limit,
    JSON.stringify({ recentlyViewed: DEFAULT_CAROUSEL_STYLE }),
    sortOrder
  );
}

function seedHomeWidgets(): void {
  if (getSetting(HOME_WIDGETS_SEED_KEY) === "1") return;

  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM home_widgets")
    .get() as { total: number };

  if (total > 0) {
    setSetting(HOME_WIDGETS_SEED_KEY, "1");
    return;
  }

  const insert = db.prepare(
    `INSERT INTO home_widgets
       (type, eyebrow, title, subtitle, link, link_label, banner_layout, aspect, item_limit, config, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    insert.run("slider", null, null, null, null, null, 1, "wide", 8, "{}", 0);
    insert.run(
      "categories",
      "Bölüm 01 — Koleksiyon",
      "Ürün Grupları",
      null,
      null,
      null,
      1,
      "wide",
      0,
      "{}",
      1
    );
    insert.run(
      "featured_products",
      "Bölüm 02 — Seçki",
      "Öne Çıkan Ürünler",
      null,
      "/urunler",
      "Tüm Ürünler",
      1,
      "wide",
      8,
      "{}",
      2
    );
    insert.run(
      "process",
      "Nasıl çalışır",
      "Tekliften\n*teslime*\ntemiz bir süreç.",
      null,
      null,
      null,
      1,
      "wide",
      0,
      JSON.stringify({ steps: DEFAULT_PROCESS_STEPS }),
      3
    );
    insert.run(
      "new_products",
      "Bölüm 03 — Stok",
      "Yeni Gelenler",
      "Kataloğa eklenen son ürünler. Fiyatlar teklif bazlıdır; ürün kodunu belirterek ekibimizden fiyat isteyebilirsiniz.",
      null,
      null,
      1,
      "wide",
      6,
      "{}",
      4
    );
    insertRecentlyViewedWidget(5);
    setSetting(HOME_WIDGETS_SEED_KEY, "1");
  })();
}

// Eski kurulumlarda seed bayrağı zaten 1 olduğundan yeni bölüm burada eklenir.
function ensureRecentlyViewedWidget(): void {
  if (getSetting(RECENTLY_VIEWED_WIDGET_SEED_KEY) === "1") return;

  const { total } = db
    .prepare(
      "SELECT COUNT(*) AS total FROM home_widgets WHERE type = 'recently_viewed'"
    )
    .get() as { total: number };

  if (total === 0) {
    const { next } = db
      .prepare(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM home_widgets"
      )
      .get() as { next: number };
    insertRecentlyViewedWidget(next);
  }

  setSetting(RECENTLY_VIEWED_WIDGET_SEED_KEY, "1");
}

seedHomeWidgets();
ensureRecentlyViewedWidget();
