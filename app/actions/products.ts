"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import type { AdminActionState } from "@/app/actions/admin";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isProductImageUrl } from "@/lib/image-urls";
import { nextManualId } from "@/lib/manual-products";
import { isImageReferenced } from "@/lib/product-images";
import {
  parseProductImageInput,
  parseVariantsPayload,
} from "@/lib/product-input";
import { slugify } from "@/lib/slug";
import {
  deleteProductImage,
  saveProductImage,
} from "@/lib/uploads";

export type ProductActionState = AdminActionState & {
  created?: {
    id: number;
    name: string;
    code: string;
    variantCount: number;
  };
};

function uniqueProductCode(base: string): string {
  const find = db.prepare("SELECT 1 AS found FROM products WHERE code = ?");
  if (!find.get(base)) return base;
  let suffix = 2;
  while (find.get(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function uniqueProductSlug(base: string, productId: number): string {
  const find = db.prepare("SELECT 1 AS found FROM products WHERE slug = ?");
  const root = base || `urun-${productId}`;
  let candidate = root;
  if (!find.get(candidate)) return candidate;
  candidate = `${root}-${productId}`;
  if (!find.get(candidate)) return candidate;
  let suffix = 2;
  while (find.get(`${candidate}-${suffix}`)) suffix += 1;
  return `${candidate}-${suffix}`;
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ürün adı zorunludur." };

  const codeInput = String(formData.get("code") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const tags = String(formData.get("tags") ?? "").trim() || null;

  const categoryRaw = String(formData.get("categoryId") ?? "").trim();
  const categoryId = categoryRaw === "" ? null : Number(categoryRaw);
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
    return { error: "Geçersiz kategori." };
  }
  if (
    categoryId !== null &&
    !db.prepare("SELECT 1 AS found FROM categories WHERE id = ?").get(categoryId)
  ) {
    return { error: "Kategori bulunamadı." };
  }

  const imageResult = parseProductImageInput(formData.get("imageUrls"));
  if (!imageResult.ok) return { error: imageResult.error };

  const variantResult = parseVariantsPayload(formData.get("variants"));
  if (!variantResult.ok) return { error: variantResult.error };
  const variants = variantResult.value;

  if (codeInput) {
    const owner = db
      .prepare("SELECT 1 AS found FROM products WHERE code = ?")
      .get(codeInput);
    if (owner) {
      return { error: `"${codeInput}" kodu başka bir üründe kullanılıyor.` };
    }
  }

  const isFeatured = formData.get("isFeatured") === "on" ? 1 : 0;
  const isHidden = formData.get("isHidden") === "on" ? 1 : 0;

  let productId = 0;
  let code = "";

  try {
    db.transaction(() => {
      productId = nextManualId("products");
      code = codeInput || uniqueProductCode(`MAN-${productId}`);
      const slug = uniqueProductSlug(slugify(name), productId);

      db.prepare(
        `INSERT INTO products
           (id, code, name, slug, description, tags, baski_fiyatlari,
            category_id, is_featured, is_hidden, active, images, source,
            meta_title, meta_description, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, 1, ?, 'manual', NULL, NULL, datetime('now'))`
      ).run(
        productId,
        code,
        name,
        slug,
        description,
        tags,
        categoryId,
        isFeatured,
        isHidden,
        JSON.stringify(imageResult.value)
      );

      let variantId = nextManualId("variants");
      const insert = db.prepare(
        `INSERT INTO variants
           (id, product_id, attr_group, attr_name, images, price, net_price,
            discount, stock, price_updated_at, price_source, is_hidden,
            active, source, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, NULL, NULL, ?,
                 CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END,
                 ?, ?, 1, 'manual', datetime('now'))`
      );
      for (const variant of variants) {
        insert.run(
          variantId++,
          productId,
          variant.name,
          JSON.stringify(variant.images),
          variant.price,
          variant.stock,
          variant.price,
          variant.price === null ? null : "manual",
          variant.isHidden ? 1 : 0
        );
      }
    }).immediate();
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("catalog");

  return {
    ok: true,
    message: `"${name}" eklendi.`,
    nonce: crypto.randomUUID(),
    created: {
      id: productId,
      name,
      code,
      variantCount: variants.length,
    },
  };
}

function productVariantCount(productId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM variants WHERE product_id = ?")
    .get(productId) as { total: number };
  return row.total;
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const productId = Number(formData.get("productId"));
  if (!Number.isInteger(productId) || productId <= 0) {
    redirect("/admin/urunler/cop?hata=bulunamadi");
  }

  const product = db
    .prepare(
      "SELECT id, name, code FROM products WHERE id = ? AND deleted_at IS NULL"
    )
    .get(productId) as
    | { id: number; name: string; code: string }
    | undefined;
  if (!product) redirect("/admin/urunler/cop?hata=bulunamadi");

  const variantCount = productVariantCount(productId);

  db.transaction(() => {
    db.prepare(
      `UPDATE products
       SET deleted_at = datetime('now'), deleted_active = active, active = 0,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(productId);

    db.prepare(
      `INSERT INTO product_operations
         (product_id, product_name, product_code, action, variant_count)
       VALUES (?, ?, ?, 'delete', ?)`
    ).run(productId, product.name, product.code, variantCount);
  }).immediate();

  updateTag("catalog");
  redirect("/admin/urunler/cop?durum=silindi");
}

export async function restoreProductAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const productId = Number(formData.get("productId"));
  if (!Number.isInteger(productId) || productId <= 0) {
    redirect("/admin/urunler/cop?hata=bulunamadi");
  }

  const product = db
    .prepare(
      "SELECT id, name, code FROM products WHERE id = ? AND deleted_at IS NOT NULL"
    )
    .get(productId) as
    | { id: number; name: string; code: string }
    | undefined;
  if (!product) redirect("/admin/urunler/cop?hata=bulunamadi");

  const variantCount = productVariantCount(productId);

  db.transaction(() => {
    db.prepare(
      `UPDATE products
       SET deleted_at = NULL, active = COALESCE(deleted_active, 1),
           deleted_active = NULL, updated_at = datetime('now')
       WHERE id = ?`
    ).run(productId);

    db.prepare(
      `INSERT INTO product_operations
         (product_id, product_name, product_code, action, variant_count)
       VALUES (?, ?, ?, 'restore', ?)`
    ).run(productId, product.name, product.code, variantCount);
  }).immediate();

  updateTag("catalog");
  redirect("/admin/urunler/cop?durum=geri-alindi");
}

export async function uploadProductImageAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bu işlem için yetkiniz yok." };
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { error: "Lütfen bir görsel seçin." };
  }

  try {
    return { url: await saveProductImage(file) };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function deleteProductImageAction(
  url: string
): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Bu işlem için yetkiniz yok." };
  }
  if (!isProductImageUrl(url)) {
    return { error: "Geçersiz görsel adresi." };
  }
  if (isImageReferenced(url)) {
    return { error: "Görsel bir varyantta kullanıldığı için silinmedi." };
  }

  await deleteProductImage(url);
  return { ok: true };
}
