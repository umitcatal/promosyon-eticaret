import { backfillCategoryImages } from "./category-images";
import { db, setSetting } from "./db";
import { slugify } from "./slug";
import {
  cleanDescription,
  extractImages,
  extractPrice,
  loadCatalogXml,
  parseCatalogXml,
  parseCategoryPath,
  parseRatio,
  parseStock,
  parseTurkishPrice,
  type XmlRecord,
  type XmlSource,
} from "./xml";

export type SyncResult = {
  categories: number;
  categoryImages: number;
  products: number;
  variants: number;
  deactivatedProducts: number;
  deactivatedVariants: number;
  priceUpdated: number;
  codeTransfers: number;
  source: XmlSource | null;
  xmlPath: string | null;
  durationMs: number;
};

type PreparedRecord = {
  productId: number;
  productCode: string;
  variantId: number;
  attrGroup: string;
  attrName: string;
  productName: string;
  description: string;
  tags: string;
  images: string[];
  categoryPath: string[];
  price: number | null;
  netPrice: number | null;
  discount: number | null;
  stock: number | null;
  printHtml: string;
};

export function prepareRecords(records: XmlRecord[]): PreparedRecord[] {
  const prepared: PreparedRecord[] = [];
  for (const record of records) {
    const productId = Number(record.urun_id);
    const variantId = Number(record.urunattr_id);
    if (!Number.isFinite(productId) || !Number.isFinite(variantId)) continue;
    prepared.push({
      productId,
      productCode: (record.urunkodu ?? "").trim(),
      variantId,
      attrGroup: (record.urunattrgr ?? "").trim(),
      attrName: (record.urunattradi ?? "").trim(),
      productName: (record.urunadi ?? "").trim(),
      description: cleanDescription(record.urunaciklamasi),
      tags: (record.stoktag ?? "").trim(),
      images: extractImages(record),
      categoryPath: parseCategoryPath(record.kategori),
      price: extractPrice(record),
      netPrice: parseTurkishPrice(record.netfiyat),
      discount: parseRatio(record.iskonto),
      stock: parseStock(record.stokmiktar),
      printHtml: (record.urunbaskifiyatlari ?? "").trim(),
    });
  }
  return prepared;
}

function baseProductName(variants: PreparedRecord[]): string {
  if (variants.length === 1) return variants[0].productName;

  const wordsList = variants.map((variant) =>
    variant.productName.split(/\s+/).filter(Boolean)
  );
  const first = wordsList[0];
  const lower = (word: string) => word.toLocaleLowerCase("tr");

  let prefixLength = 0;
  prefix: for (; prefixLength < first.length; prefixLength += 1) {
    for (const words of wordsList) {
      if (
        words[prefixLength] === undefined ||
        lower(words[prefixLength]) !== lower(first[prefixLength])
      ) {
        break prefix;
      }
    }
  }

  let suffixLength = 0;
  suffix: for (; suffixLength < first.length - prefixLength; suffixLength += 1) {
    const index = first.length - 1 - suffixLength;
    for (const words of wordsList) {
      const word = words[words.length - 1 - suffixLength];
      if (word === undefined || lower(word) !== lower(first[index])) {
        break suffix;
      }
    }
  }

  const result = [
    ...first.slice(0, prefixLength),
    ...first.slice(first.length - suffixLength),
  ]
    .join(" ")
    .trim();

  return result.length >= 3 ? result : variants[0].productName;
}

export async function syncCatalog(): Promise<SyncResult> {
  const startedAt = Date.now();
  const loaded = await loadCatalogXml();
  const source = parseCatalogXml(loaded.xml);
  const prepared = prepareRecords(source);

  db.exec(
    "CREATE TEMP TABLE IF NOT EXISTS sync_seen_products (id INTEGER PRIMARY KEY)"
  );
  db.exec(
    "CREATE TEMP TABLE IF NOT EXISTS sync_seen_variants (id INTEGER PRIMARY KEY)"
  );

  const findCategory = db.prepare(
    "SELECT id FROM categories WHERE parent_id IS ? AND slug = ?"
  );
  const insertCategory = db.prepare(
    "INSERT INTO categories (parent_id, name, slug) VALUES (?, ?, ?)"
  );
  const findProductSlug = db.prepare(
    "SELECT id FROM products WHERE slug = ?"
  );
  const findProductCode = db.prepare(
    "SELECT id FROM products WHERE code = ?"
  );
  const setProductCode = db.prepare(
    "UPDATE products SET code = ? WHERE id = ?"
  );
  const upsertProduct = db.prepare(`
    INSERT INTO products (id, code, name, slug, description, tags, baski_fiyatlari, category_id, active, updated_at)
    VALUES (@id, @code, @name, @slug, @description, @tags, @printHtml, @categoryId, 1, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      code = excluded.code,
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      tags = excluded.tags,
      baski_fiyatlari = excluded.baski_fiyatlari,
      category_id = excluded.category_id,
      active = 1,
      updated_at = datetime('now')
  `);
  const upsertVariant = db.prepare(`
    INSERT INTO variants (id, product_id, attr_group, attr_name, images, net_price, discount, stock, active, updated_at)
    VALUES (@id, @productId, @attrGroup, @attrName, @images, @netPrice, @discount, @stock, 1, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      product_id = excluded.product_id,
      attr_group = excluded.attr_group,
      attr_name = excluded.attr_name,
      images = excluded.images,
      net_price = excluded.net_price,
      discount = excluded.discount,
      stock = excluded.stock,
      active = 1,
      updated_at = datetime('now')
  `);
  const markProduct = db.prepare(
    "INSERT OR IGNORE INTO sync_seen_products (id) VALUES (?)"
  );
  const markVariant = db.prepare(
    "INSERT OR IGNORE INTO sync_seen_variants (id) VALUES (?)"
  );
  const updateVariantPrice = db.prepare(
    `UPDATE variants SET price = ?, price_source = 'xml', price_updated_at = datetime('now')
     WHERE id = ?`
  );

  const run = db.transaction((items: PreparedRecord[]) => {
    db.exec("DELETE FROM sync_seen_products");
    db.exec("DELETE FROM sync_seen_variants");

    const categoryCache = new Map<string, number>();
    const usedCategoryIds = new Set<number>();
    let priceUpdated = 0;
    let codeTransfers = 0;

    function findFreeCode(base: string): string {
      let candidate = base;
      let suffix = 2;
      while (findProductCode.get(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
      }
      return candidate;
    }

    function upsertCategoryPath(path: string[]): number | null {
      if (path.length === 0) return null;
      const cacheKey = path.join(" > ");
      const cached = categoryCache.get(cacheKey);
      if (cached) return cached;

      let parentId: number | null = null;
      for (const name of path) {
        const slug = slugify(name) || "kategori";
        const existing = findCategory.get(parentId, slug) as
          | { id: number }
          | undefined;
        if (existing) {
          parentId = existing.id;
        } else {
          const info = insertCategory.run(parentId, name, slug);
          parentId = Number(info.lastInsertRowid);
        }
      }
      if (parentId !== null) categoryCache.set(cacheKey, parentId);
      return parentId;
    }

    const groups = new Map<number, PreparedRecord[]>();
    for (const item of items) {
      const list = groups.get(item.productId);
      if (list) list.push(item);
      else groups.set(item.productId, [item]);
    }
    const incomingIds = new Set(groups.keys());

    for (const [productId, variants] of groups) {
      variants.sort((a, b) => a.variantId - b.variantId);
      const base = variants[0];
      const productName = baseProductName(variants);

      const categoryId = upsertCategoryPath(base.categoryPath);
      if (categoryId !== null) usedCategoryIds.add(categoryId);

      let slug = slugify(productName) || `urun-${productId}`;
      const owner = findProductSlug.get(slug) as { id: number } | undefined;
      if (owner && owner.id !== productId) slug = `${slug}-${productId}`;

      let productCode = base.productCode || String(productId);
      const codeOwner = findProductCode.get(productCode) as
        | { id: number }
        | undefined;
      if (codeOwner && codeOwner.id !== productId) {
        if (incomingIds.has(codeOwner.id)) {
          productCode = findFreeCode(`${productCode}-${productId}`);
        } else {
          const freedCode = findFreeCode(
            `${productCode}-${codeOwner.id}`
          );
          setProductCode.run(freedCode, codeOwner.id);
          codeTransfers += 1;
        }
      }

      upsertProduct.run({
        id: productId,
        code: productCode,
        name: productName || `Ürün ${productId}`,
        slug,
        description: base.description,
        tags: base.tags,
        printHtml: base.printHtml || null,
        categoryId,
      });
      markProduct.run(productId);

      for (const variant of variants) {
        upsertVariant.run({
          id: variant.variantId,
          productId,
          attrGroup: variant.attrGroup,
          attrName: variant.attrName,
          images: JSON.stringify(variant.images),
          netPrice: variant.netPrice,
          discount: variant.discount,
          stock: variant.stock,
        });
        markVariant.run(variant.variantId);
        if (variant.price !== null) {
          priceUpdated += updateVariantPrice.run(
            variant.price,
            variant.variantId
          ).changes;
        }
      }
    }

    const deactivatedProducts = db
      .prepare(
        "UPDATE products SET active = 0 WHERE active = 1 AND id NOT IN (SELECT id FROM sync_seen_products)"
      )
      .run().changes;
    const deactivatedVariants = db
      .prepare(
        "UPDATE variants SET active = 0 WHERE active = 1 AND id NOT IN (SELECT id FROM sync_seen_variants)"
      )
      .run().changes;

    return {
      categories: usedCategoryIds.size,
      products: groups.size,
      variants: items.length,
      deactivatedProducts,
      deactivatedVariants,
      priceUpdated,
      codeTransfers,
    };
  });

  const result = run(prepared);
  const categoryImages = backfillCategoryImages();
  const fullResult: SyncResult = {
    ...result,
    categoryImages,
    source: loaded.source,
    xmlPath: loaded.path,
    durationMs: Date.now() - startedAt,
  };
  setSetting("last_sync_at", new Date().toISOString());
  setSetting("last_sync_result", JSON.stringify(fullResult));
  return fullResult;
}
