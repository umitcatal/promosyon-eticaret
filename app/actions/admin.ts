"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db, getSetting, setSetting } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/orders";
import { syncCatalog } from "@/lib/sync";
import {
  deleteCategoryImage,
  deleteLogoImage,
  deleteSliderImage,
  saveCategoryImage,
  saveLogoImage,
  saveSliderImage,
} from "@/lib/uploads";

export type AdminActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  nonce?: string;
};

function parsePrice(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "")
    .trim()
    .replace(",", ".");
  if (value === "") return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Geçersiz fiyat değeri");
  }
  return price;
}

export async function syncCatalogAction(): Promise<AdminActionState> {
  await requireAdmin();
  try {
    const result = await syncCatalog();
    updateTag("catalog");
    const sourceLabel =
      result.source === "api"
        ? `API'den çekildi ve "${result.xmlPath}" dosyasına yazıldı`
        : `API'ye ulaşılamadı, "${result.xmlPath}" dosyası kullanıldı`;
    const priceLabel =
      result.priceUpdated > 0 ? `, ${result.priceUpdated} fiyat` : "";
    const codeLabel =
      result.codeTransfers > 0
        ? `, ${result.codeTransfers} kod çakışması giderildi`
        : "";
    const imageLabel =
      result.categoryImages > 0
        ? `, ${result.categoryImages} kategori görseli eklendi`
        : "";
    return {
      ok: true,
      message: `${sourceLabel}: ${result.products} ürün, ${result.variants} varyant${priceLabel}${codeLabel}${imageLabel} güncellendi (${(result.durationMs / 1000).toFixed(1)} sn).`,
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function updateProductAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const productId = Number(formData.get("productId"));
  if (!Number.isInteger(productId) || productId <= 0) {
    return { error: "Geçersiz ürün" };
  }

  const isFeatured = formData.get("isFeatured") === "on" ? 1 : 0;
  const isHidden = formData.get("isHidden") === "on" ? 1 : 0;

  const variants = db
    .prepare("SELECT id FROM variants WHERE product_id = ?")
    .all(productId) as { id: number }[];

  try {
    const run = db.transaction(() => {
      db.prepare(
        "UPDATE products SET is_featured = ?, is_hidden = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(isFeatured, isHidden, productId);

      const updateVariant = db.prepare(
        `UPDATE variants SET price = ?, price_source = ?, price_updated_at = datetime('now'), is_hidden = ?
         WHERE id = ?`
      );
      for (const variant of variants) {
        const price = parsePrice(formData.get(`price_${variant.id}`));
        const hidden = formData.get(`hidden_${variant.id}`) === "on" ? 1 : 0;
        updateVariant.run(
          price,
          price === null ? null : "manual",
          hidden,
          variant.id
        );
      }
    });
    run();
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("catalog");
  return { ok: true, message: "Ürün ve varyantlar güncellendi." };
}

export async function updateCategoryAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const categoryId = Number(formData.get("categoryId"));
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return { error: "Geçersiz kategori." };
  }

  const existing = db
    .prepare("SELECT image_url FROM categories WHERE id = ?")
    .get(categoryId) as { image_url: string | null } | undefined;
  if (!existing) {
    return { error: "Kategori bulunamadı." };
  }

  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const active = formData.get("active") === "on" ? 1 : 0;
  const removeImage = formData.get("removeImage") === "on";
  const file = formData.get("image");

  let newImage: string | null = null;

  try {
    if (file instanceof File && file.size > 0) {
      newImage = await saveCategoryImage(file);
    }

    const imageUrl = newImage ?? (removeImage ? null : existing.image_url);

    db.prepare(
      "UPDATE categories SET image_url = ?, sort_order = ?, active = ? WHERE id = ?"
    ).run(imageUrl, sortOrder, active, categoryId);

    if (existing.image_url && existing.image_url !== imageUrl) {
      await deleteCategoryImage(existing.image_url);
    }

    updateTag("catalog");
    return {
      ok: true,
      message: "Kategori güncellendi.",
      nonce: crypto.randomUUID(),
    };
  } catch (error) {
    if (newImage) await deleteCategoryImage(newImage);
    return { error: (error as Error).message };
  }
}

export async function saveSliderAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const id = Number(formData.get("sliderId") ?? 0);
  const title = String(formData.get("title") ?? "").trim() || null;
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const link = String(formData.get("link") ?? "").trim() || null;
  const file = formData.get("image");

  try {
    const existing =
      id > 0
        ? (db
            .prepare("SELECT image_url, active FROM slider WHERE id = ?")
            .get(id) as { image_url: string; active: number } | undefined)
        : undefined;
    if (id > 0 && !existing) {
      return { error: "Slider bulunamadı." };
    }

    const active = formData.has("active")
      ? formData.get("active") === "on"
        ? 1
        : 0
      : (existing?.active ?? 1);

    const hasNewImage = file instanceof File && file.size > 0;
    const imageUrl = hasNewImage
      ? await saveSliderImage(file)
      : existing?.image_url;

    if (!imageUrl) {
      return { error: "Lütfen bir görsel yükleyin." };
    }

    if (id > 0) {
      db.prepare(
        `UPDATE slider SET image_url = ?, title = ?, subtitle = ?, link = ?, active = ?
         WHERE id = ?`
      ).run(imageUrl, title, subtitle, link, active, id);
    } else {
      const { next } = db
        .prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM slider")
        .get() as { next: number };
      db.prepare(
        `INSERT INTO slider (image_url, title, subtitle, link, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(imageUrl, title, subtitle, link, next, active);
    }

    if (existing && hasNewImage && existing.image_url !== imageUrl) {
      await deleteSliderImage(existing.image_url);
    }

    updateTag("slider");
    return {
      ok: true,
      message: id > 0 ? "Slider güncellendi." : "Slider eklendi.",
      nonce: crypto.randomUUID(),
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function toggleSliderActiveAction(
  sliderId: number,
  active: boolean
): Promise<void> {
  await requireAdmin();
  if (!Number.isInteger(sliderId) || sliderId <= 0) return;
  db.prepare("UPDATE slider SET active = ? WHERE id = ?").run(
    active ? 1 : 0,
    sliderId
  );
  updateTag("slider");
}

export async function reorderSlidesAction(sliderIds: number[]): Promise<void> {
  await requireAdmin();
  if (
    !Array.isArray(sliderIds) ||
    sliderIds.length === 0 ||
    sliderIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(sliderIds).size !== sliderIds.length
  ) {
    return;
  }

  const update = db.prepare("UPDATE slider SET sort_order = ? WHERE id = ?");
  db.transaction(() => {
    sliderIds.forEach((id, index) => update.run(index, id));
  })();
  updateTag("slider");
}

export async function deleteSliderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("sliderId"));
  if (!Number.isInteger(id) || id <= 0) return;

  const row = db
    .prepare("SELECT image_url FROM slider WHERE id = ?")
    .get(id) as { image_url: string } | undefined;
  db.prepare("DELETE FROM slider WHERE id = ?").run(id);
  if (row) await deleteSliderImage(row.image_url);
  updateTag("slider");
}

export async function updateOrderStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(orderId) || orderId <= 0) return;
  if (!ORDER_STATUSES.some((option) => option.value === status)) return;

  db.prepare(
    "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, orderId);
  refresh();
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = Number(formData.get("userId"));
  const role = String(formData.get("role") ?? "");
  if (!Number.isInteger(userId) || userId <= 0) return;
  if (role !== "admin" && role !== "customer") return;
  if (userId === admin.id && role !== "admin") return;

  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
  refresh();
}

export async function saveSettingsAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const priceXmlUrl = String(formData.get("priceXmlUrl") ?? "").trim();
  setSetting("price_xml_url", priceXmlUrl);
  return { ok: true, message: "Ayarlar kaydedildi." };
}

export async function saveLogoAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const current = getSetting("logo_url");
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Lütfen bir logo görseli seçin." };
  }

  try {
    const newImage = await saveLogoImage(file);
    setSetting("logo_url", newImage);
    if (current && current !== newImage) await deleteLogoImage(current);
    updateTag("settings");
    return { ok: true, message: "Logo güncellendi.", nonce: crypto.randomUUID() };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removeLogoAction(_formData: FormData): Promise<void> {
  await requireAdmin();
  const current = getSetting("logo_url");
  setSetting("logo_url", "");
  if (current) await deleteLogoImage(current);
  updateTag("settings");
}

export async function syncPricesAction(): Promise<AdminActionState> {
  await requireAdmin();
  const { syncPrices } = await import("@/lib/price-sync");
  try {
    const result = await syncPrices();
    updateTag("catalog");
    return {
      ok: true,
      message: `${result.updated} varyantın fiyatı güncellendi.`,
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
