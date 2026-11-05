"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminActionState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseHomeWidgetConfig } from "@/lib/home-widgets";
import { normalizeSearchQuery, toLikePattern } from "@/lib/search-fold";
import { slugify } from "@/lib/slug";
import type { CollectionProductOption } from "@/lib/types";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "arama",
  "giris",
  "hesabim",
  "kategori",
  "kayit",
  "koleksiyon",
  "sepet",
  "urun",
  "urunler",
]);

function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function parseIdList(raw: FormDataEntryValue | null, max = 500): number[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const ids: number[] = [];
  const seen = new Set<number>();
  for (const value of parsed) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= max) break;
  }
  return ids;
}

function filterExistingProducts(ids: number[]): number[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT id FROM products WHERE id IN (${placeholders})`)
    .all(...ids) as { id: number }[];
  const existing = new Set(rows.map((row) => row.id));
  return ids.filter((id) => existing.has(id));
}

function filterExistingCategories(ids: number[]): number[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT id FROM categories WHERE id IN (${placeholders})`)
    .all(...ids) as { id: number }[];
  const existing = new Set(rows.map((row) => row.id));
  return ids.filter((id) => existing.has(id));
}

function uniqueCollectionSlug(base: string, excludeId: number): string {
  let candidate = base;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const conflict = db
      .prepare("SELECT id FROM collections WHERE slug = ? AND id != ?")
      .get(candidate, excludeId) as { id: number } | undefined;
    if (!conflict) return candidate;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now()}`;
}

export async function saveCollectionAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const collectionId = Number(formData.get("collectionId") ?? 0);
  if (!Number.isInteger(collectionId) || collectionId < 0) {
    return { error: "Geçersiz koleksiyon." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name === "") return { error: "Koleksiyon adı gerekli." };
  if (name.length > 120) {
    return { error: "Koleksiyon adı en fazla 120 karakter olabilir." };
  }

  const description = textOrNull(formData.get("description"));
  if (description && description.length > 1000) {
    return { error: "Açıklama en fazla 1000 karakter olabilir." };
  }

  const active = formData.get("active") === "on" ? 1 : 0;
  const includeChildren =
    formData.get("includeChildren") === "on" ? 1 : 0;
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const base = slugify(rawSlug || name);
  if (base === "") {
    return { error: "Geçerli bir adres (slug) üretilemedi." };
  }
  if (RESERVED_SLUGS.has(base)) {
    return { error: "Bu adres kullanılamaz; farklı bir slug girin." };
  }

  const productIds = filterExistingProducts(
    parseIdList(formData.get("products"))
  );
  const categoryIds = filterExistingCategories(
    parseIdList(formData.get("categoryIds"))
  );

  let savedId = collectionId;
  try {
    db.transaction(() => {
      const slug = uniqueCollectionSlug(base, collectionId);

      if (collectionId > 0) {
        const existing = db
          .prepare("SELECT id FROM collections WHERE id = ?")
          .get(collectionId);
        if (!existing) throw new Error("Koleksiyon bulunamadı.");

        db.prepare(
          `UPDATE collections
           SET name = ?, slug = ?, description = ?, active = ?,
               include_children = ?, updated_at = datetime('now')
           WHERE id = ?`
        ).run(
          name,
          slug,
          description,
          active,
          includeChildren,
          collectionId
        );
      } else {
        const result = db
          .prepare(
            "INSERT INTO collections (name, slug, description, active, include_children) VALUES (?, ?, ?, ?, ?)"
          )
          .run(name, slug, description, active, includeChildren);
        savedId = Number(result.lastInsertRowid);
      }

      db.prepare("DELETE FROM collection_products WHERE collection_id = ?").run(
        savedId
      );
      const insertProduct = db.prepare(
        `INSERT INTO collection_products (collection_id, product_id, sort_order)
         VALUES (?, ?, ?)`
      );
      productIds.forEach((productId, index) => {
        insertProduct.run(savedId, productId, index);
      });

      db.prepare(
        "DELETE FROM collection_categories WHERE collection_id = ?"
      ).run(savedId);
      const insertCategory = db.prepare(
        "INSERT INTO collection_categories (collection_id, category_id) VALUES (?, ?)"
      );
      categoryIds.forEach((categoryId) => {
        insertCategory.run(savedId, categoryId);
      });
    })();
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("collections");
  updateTag("homepage");

  if (collectionId === 0) {
    redirect(`/admin/koleksiyonlar/${savedId}`);
  }

  return {
    ok: true,
    message: "Koleksiyon kaydedildi.",
    nonce: crypto.randomUUID(),
  };
}

export async function deleteCollectionAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();

  const collectionId = Number(formData.get("collectionId"));
  if (!Number.isInteger(collectionId) || collectionId <= 0) return;

  const widgets = db
    .prepare("SELECT config FROM home_widgets WHERE type = 'collection'")
    .all() as { config: string }[];
  const referenced = widgets.some(
    (widget) =>
      parseHomeWidgetConfig(widget.config).collection?.collectionId ===
      collectionId
  );
  if (referenced) {
    redirect("/admin/koleksiyonlar?hata=referansli");
  }

  db.prepare("DELETE FROM collections WHERE id = ?").run(collectionId);
  updateTag("collections");
  updateTag("homepage");
  redirect("/admin/koleksiyonlar?durum=silindi");
}

export async function toggleCollectionActiveAction(
  collectionId: number,
  active: boolean
): Promise<void> {
  await requireAdmin();
  if (!Number.isInteger(collectionId) || collectionId <= 0) return;

  db.prepare(
    "UPDATE collections SET active = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(active ? 1 : 0, collectionId);
  updateTag("collections");
  updateTag("homepage");
}

export async function searchCollectionProductsAction(
  query: string
): Promise<{ items: CollectionProductOption[]; error?: string }> {
  await requireAdmin();

  const normalized = normalizeSearchQuery(query);
  if (normalized.length < 2) return { items: [] };

  const pattern = toLikePattern(normalized);
  const rows = db
    .prepare(
      `SELECT p.id, p.code, p.name, p.slug
       FROM products p
       WHERE p.active = 1 AND p.is_hidden = 0 AND (
         tr_fold(p.name) LIKE ? ESCAPE '\\' OR tr_fold(p.code) LIKE ? ESCAPE '\\'
       )
       ORDER BY p.is_featured DESC, p.id DESC
       LIMIT 20`
    )
    .all(pattern, pattern) as CollectionProductOption[];

  return { items: rows };
}
