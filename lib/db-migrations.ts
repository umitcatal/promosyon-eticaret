import type Database from "better-sqlite3";

const MIGRATION_VERSION = 1;

const SITE_SETTING_KEYS = [
  "logo_url",
  "header_catalog",
  "google_tag_id",
  "whatsapp_number",
  "whatsapp_welcome_message",
  "whatsapp_title",
  "whatsapp_enabled",
  "quote_phone",
  "quote_email",
  "contact_address",
  "mail_settings",
] as const;

type Db = Database.Database;

function tableColumns(db: Db, table: string): string[] {
  return (
    db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  ).map((column) => column.name);
}

function hasColumn(db: Db, table: string, column: string): boolean {
  return tableColumns(db, table).includes(column);
}

function addSiteColumn(db: Db, table: string): void {
  if (hasColumn(db, table, "site_id")) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN site_id INTEGER NOT NULL DEFAULT 1`);
}

function rebuildPages(db: Db): void {
  if (hasColumn(db, "pages", "site_id")) return;

  db.exec(`
    CREATE TABLE pages_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL DEFAULT 1 REFERENCES sites(id),
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      meta_title TEXT,
      meta_description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(site_id, slug)
    );
    INSERT INTO pages_new
      (id, site_id, slug, title, content, meta_title, meta_description, active, created_at, updated_at)
    SELECT id, 1, slug, title, content, meta_title, meta_description, active, created_at, updated_at
    FROM pages;
    DROP TABLE pages;
    ALTER TABLE pages_new RENAME TO pages;
  `);
}

function rebuildCollections(db: Db): void {
  if (hasColumn(db, "collections", "site_id")) return;

  db.exec(`
    CREATE TABLE collections_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL DEFAULT 1 REFERENCES sites(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      include_children INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(site_id, slug)
    );
    INSERT INTO collections_new
      (id, site_id, name, slug, description, active, include_children, created_at, updated_at)
    SELECT id, 1, name, slug, description, active, include_children, created_at, updated_at
    FROM collections;
    DROP TABLE collections;
    ALTER TABLE collections_new RENAME TO collections;
  `);
}

function createBaseTables(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (site_id, key)
    );
  `);

  const insertSite = db.prepare(
    `INSERT OR IGNORE INTO sites (id, name, slug, active) VALUES (?, ?, ?, 1)`
  );
  insertSite.run(1, "Kurumsal Promo", "1");
  insertSite.run(2, "Kurumsal Promo 2", "2");
}

function migrateSettings(db: Db): void {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO site_settings (site_id, key, value) VALUES (?, ?, ?)`
  );
  const getGlobal = db.prepare("SELECT value FROM settings WHERE key = ?");

  for (const key of SITE_SETTING_KEYS) {
    const row = getGlobal.get(key) as { value: string } | undefined;
    if (row) insert.run(1, key, row.value);
  }

  const seeded = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("home_widgets_seeded") as { value: string } | undefined;
  if (seeded) insert.run(1, "home_widgets_seeded", seeded.value);

  const recentlySeeded = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("recently_viewed_widget_seeded") as { value: string } | undefined;
  if (recentlySeeded) {
    insert.run(1, "recently_viewed_widget_seeded", recentlySeeded.value);
  }

  insert.run(1, "theme_preset", "1");
  insert.run(2, "site_name", "Kurumsal Promo 2");
  insert.run(2, "seo_title", "Kurumsal Promo 2 | Kurumsal Promosyon Ürünleri");
  insert.run(2, "theme_preset", "2");
}

function setSiteSetting(db: Db, siteId: number, key: string, value: string) {
  db.prepare(
    `INSERT INTO site_settings (site_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(site_id, key) DO UPDATE SET value = excluded.value`
  ).run(siteId, key, value);
}

function cloneSettings(db: Db): void {
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM site_settings WHERE site_id = 2")
    .get() as { total: number };
  if (total > 0) return;

  db.exec(`
    INSERT INTO site_settings (site_id, key, value)
    SELECT 2, key, value FROM site_settings WHERE site_id = 1
  `);
  setSiteSetting(db, 2, "site_name", "Kurumsal Promo 2");
  setSiteSetting(db, 2, "seo_title", "Kurumsal Promo 2 | Kurumsal Promosyon Ürünleri");
  setSiteSetting(db, 2, "theme_preset", "2");
}

function clonePages(db: Db): Map<number, number> {
  const map = new Map<number, number>();
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM pages WHERE site_id = 2")
    .get() as { total: number };
  if (total > 0) return map;

  const pages = db
    .prepare("SELECT * FROM pages WHERE site_id = 1 ORDER BY id")
    .all() as Record<string, unknown>[];
  const insert = db.prepare(
    `INSERT INTO pages
       (site_id, slug, title, content, meta_title, meta_description, active, created_at, updated_at)
     VALUES (2, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const page of pages) {
    const result = insert.run(
      page.slug,
      page.title,
      page.content,
      page.meta_title,
      page.meta_description,
      page.active,
      page.created_at,
      page.updated_at
    );
    map.set(Number(page.id), Number(result.lastInsertRowid));
  }
  return map;
}

function cloneMenu(db: Db, pageMap: Map<number, number>): void {
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM menu_items WHERE site_id = 2")
    .get() as { total: number };
  if (total > 0) return;

  const rows = db
    .prepare("SELECT * FROM menu_items WHERE site_id = 1 ORDER BY id")
    .all() as Record<string, unknown>[];
  const insert = db.prepare(
    `INSERT INTO menu_items
       (site_id, label, type, href, page_id, open_in_new_tab, sort_order, active)
     VALUES (2, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const row of rows) {
    const oldPageId = row.page_id === null ? null : Number(row.page_id);
    insert.run(
      row.label,
      row.type,
      row.href,
      oldPageId === null ? null : (pageMap.get(oldPageId) ?? null),
      row.open_in_new_tab,
      row.sort_order,
      row.active
    );
  }
}

function cloneSlider(db: Db): void {
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM slider WHERE site_id = 2")
    .get() as { total: number };
  if (total > 0) return;

  db.exec(`
    INSERT INTO slider (site_id, image_url, title, subtitle, link, sort_order, active)
    SELECT 2, image_url, title, subtitle, link, sort_order, active
    FROM slider WHERE site_id = 1 ORDER BY id
  `);
}

function cloneCollections(db: Db): Map<number, number> {
  const map = new Map<number, number>();
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM collections WHERE site_id = 2")
    .get() as { total: number };
  if (total > 0) return map;

  const rows = db
    .prepare("SELECT * FROM collections WHERE site_id = 1 ORDER BY id")
    .all() as Record<string, unknown>[];
  const insert = db.prepare(
    `INSERT INTO collections
       (site_id, name, slug, description, active, include_children, created_at, updated_at)
     VALUES (2, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertProduct = db.prepare(
    "INSERT OR IGNORE INTO collection_products (collection_id, product_id, sort_order) VALUES (?, ?, ?)"
  );
  const insertCategory = db.prepare(
    "INSERT OR IGNORE INTO collection_categories (collection_id, category_id) VALUES (?, ?)"
  );
  const products = db.prepare(
    "SELECT product_id, sort_order FROM collection_products WHERE collection_id = ?"
  );
  const categories = db.prepare(
    "SELECT category_id FROM collection_categories WHERE collection_id = ?"
  );

  for (const row of rows) {
    const result = insert.run(
      row.name,
      row.slug,
      row.description,
      row.active,
      row.include_children,
      row.created_at,
      row.updated_at
    );
    const newId = Number(result.lastInsertRowid);
    map.set(Number(row.id), newId);

    for (const product of products.all(row.id) as {
      product_id: number;
      sort_order: number;
    }[]) {
      insertProduct.run(newId, product.product_id, product.sort_order);
    }
    for (const category of categories.all(row.id) as { category_id: number }[]) {
      insertCategory.run(newId, category.category_id);
    }
  }
  return map;
}

function mapWidgetConfig(
  raw: string,
  collectionMap: Map<number, number>
): string {
  try {
    const config = JSON.parse(raw) as Record<string, unknown>;
    const collectionId = Number(config.collectionId);
    if (Number.isInteger(collectionId) && collectionMap.has(collectionId)) {
      config.collectionId = collectionMap.get(collectionId);
    }
    return JSON.stringify(config);
  } catch {
    return raw;
  }
}

function cloneHomeWidgets(db: Db, collectionMap: Map<number, number>): boolean {
  const { total } = db
    .prepare("SELECT COUNT(*) AS total FROM home_widgets WHERE site_id = 2")
    .get() as { total: number };
  if (total > 0) return true;

  const rows = db
    .prepare("SELECT * FROM home_widgets WHERE site_id = 1 ORDER BY id")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) return false;

  const insert = db.prepare(
    `INSERT INTO home_widgets
       (site_id, type, eyebrow, title, subtitle, link, link_label, banner_layout,
        aspect, banner_width, item_limit, config, sort_order, active, created_at, updated_at)
     VALUES (2, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertBanner = db.prepare(
    `INSERT INTO home_widget_banners
       (widget_id, image_url, alt_text, link, open_in_new_tab, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const banners = db.prepare(
    "SELECT * FROM home_widget_banners WHERE widget_id = ? ORDER BY id"
  );

  for (const row of rows) {
    const result = insert.run(
      row.type,
      row.eyebrow,
      row.title,
      row.subtitle,
      row.link,
      row.link_label,
      row.banner_layout,
      row.aspect,
      row.banner_width,
      row.item_limit,
      mapWidgetConfig(String(row.config ?? "{}"), collectionMap),
      row.sort_order,
      row.active,
      row.created_at,
      row.updated_at
    );
    const newId = Number(result.lastInsertRowid);
    for (const banner of banners.all(row.id) as Record<string, unknown>[]) {
      insertBanner.run(
        newId,
        banner.image_url,
        banner.alt_text,
        banner.link,
        banner.open_in_new_tab,
        banner.sort_order,
        banner.active
      );
    }
  }
  return true;
}

function cloneSiteContent(db: Db): void {
  const pageMap = clonePages(db);
  cloneMenu(db, pageMap);
  cloneSlider(db);
  const collectionMap = cloneCollections(db);
  const widgetsCloned = cloneHomeWidgets(db, collectionMap);

  if (widgetsCloned) {
    setSiteSetting(db, 2, "home_widgets_seeded", "1");
    setSiteSetting(db, 2, "recently_viewed_widget_seeded", "1");
  }
}

function createIndexes(db: Db): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pages_site ON pages(site_id, slug);
    CREATE INDEX IF NOT EXISTS idx_collections_site ON collections(site_id, active);
    CREATE INDEX IF NOT EXISTS idx_menu_items_site ON menu_items(site_id, sort_order, id);
    CREATE INDEX IF NOT EXISTS idx_slider_site ON slider(site_id, sort_order, id);
    CREATE INDEX IF NOT EXISTS idx_home_widgets_site ON home_widgets(site_id, sort_order, id);
    CREATE INDEX IF NOT EXISTS idx_orders_site ON orders(site_id, created_at);
  `);

  const idempotencyIndex = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'idx_orders_user_idempotency'"
    )
    .get() as { sql: string | null } | undefined;
  if (idempotencyIndex && !idempotencyIndex.sql?.includes("site_id")) {
    db.exec("DROP INDEX idx_orders_user_idempotency");
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency
    ON orders(site_id, user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  `);
}

export function runMigrations(db: Db): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  if (current >= MIGRATION_VERSION) return;

  db.pragma("foreign_keys = OFF");
  try {
    db.exec("BEGIN IMMEDIATE");

    const version = db.pragma("user_version", { simple: true }) as number;
    if (version < MIGRATION_VERSION) {
      createBaseTables(db);
      rebuildPages(db);
      rebuildCollections(db);
      addSiteColumn(db, "menu_items");
      addSiteColumn(db, "slider");
      addSiteColumn(db, "home_widgets");
      addSiteColumn(db, "orders");
      migrateSettings(db);
      cloneSettings(db);
      cloneSiteContent(db);
      createIndexes(db);
      db.pragma(`user_version = ${MIGRATION_VERSION}`);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.pragma("foreign_keys = ON");
  }

  const violations = db.pragma("foreign_key_check") as unknown[];
  if (violations.length > 0) {
    throw new Error(
      `Site migration foreign key check failed: ${JSON.stringify(violations)}`
    );
  }
}
