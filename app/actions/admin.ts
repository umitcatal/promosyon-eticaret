"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  GOOGLE_TAG_SETTING_KEY,
  parseGoogleTagId,
} from "@/lib/analytics";
import { db, getSetting, setSetting } from "@/lib/db";
import { parseImages } from "@/lib/format";
import { isProductImageUrl } from "@/lib/image-urls";
import {
  MAIL_SETTINGS_KEY,
  getMailSettings,
  sendTestMail,
  type MailSettings,
} from "@/lib/mail";
import { nextManualId } from "@/lib/manual-products";
import { ORDER_STATUSES } from "@/lib/orders";
import { deleteUnreferencedProductImages } from "@/lib/product-images";
import {
  parseProductImageInput,
  parseVariantsPayload,
} from "@/lib/product-input";
import { normalizePhoneNumber } from "@/lib/quote";
import {
  QUOTE_EMAIL_SETTING_KEY,
  QUOTE_PHONE_SETTING_KEY,
} from "@/lib/quote-contact";
import { syncCatalog } from "@/lib/sync";
import { VAT_RATE_SETTING_KEY, VAT_RATES } from "@/lib/vat";
import {
  formatWhatsAppNumber,
  normalizeWhatsAppNumber,
  WHATSAPP_ENABLED_SETTING_KEY,
  WHATSAPP_NUMBER_SETTING_KEY,
  WHATSAPP_TITLE_SETTING_KEY,
  WHATSAPP_WELCOME_SETTING_KEY,
} from "@/lib/whatsapp";
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

function parseMeta(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  return value === "" ? null : value;
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

  const product = db
    .prepare("SELECT id, source FROM products WHERE id = ?")
    .get(productId) as { id: number; source: string } | undefined;
  if (!product) {
    return { error: "Ürün bulunamadı." };
  }

  const isFeatured = formData.get("isFeatured") === "on" ? 1 : 0;
  const isHidden = formData.get("isHidden") === "on" ? 1 : 0;
  const metaTitle = parseMeta(formData.get("metaTitle"));
  const metaDescription = parseMeta(formData.get("metaDescription"));

  if (product.source === "manual") {
    return updateManualProduct({
      productId,
      formData,
      isFeatured,
      isHidden,
      metaTitle,
      metaDescription,
    });
  }

  const variants = db
    .prepare("SELECT id FROM variants WHERE product_id = ?")
    .all(productId) as { id: number }[];

  try {
    const run = db.transaction(() => {
      db.prepare(
        `UPDATE products
         SET is_featured = ?, is_hidden = ?, meta_title = ?, meta_description = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      ).run(isFeatured, isHidden, metaTitle, metaDescription, productId);

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

async function updateManualProduct({
  productId,
  formData,
  isFeatured,
  isHidden,
  metaTitle,
  metaDescription,
}: {
  productId: number;
  formData: FormData;
  isFeatured: number;
  isHidden: number;
  metaTitle: string | null;
  metaDescription: string | null;
}): Promise<AdminActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Ürün adı zorunludur." };

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Ürün kodu zorunludur." };

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

  const existingRows = db
    .prepare(
      "SELECT id, images FROM variants WHERE product_id = ? AND source = 'manual' ORDER BY id"
    )
    .all(productId) as { id: number; images: string }[];
  const existingIds = new Set(existingRows.map((row) => row.id));
  for (const variant of variants) {
    if (variant.id !== undefined && !existingIds.has(variant.id)) {
      return { error: "Varyant bu ürüne ait değil." };
    }
  }

  const codeOwner = db
    .prepare("SELECT id FROM products WHERE code = ? AND id <> ?")
    .get(code, productId);
  if (codeOwner) {
    return { error: `"${code}" kodu başka bir üründe kullanılıyor.` };
  }

  try {
    db.transaction(() => {
      db.prepare(
        `UPDATE products
         SET name = ?, code = ?, description = ?, tags = ?, category_id = ?,
             is_featured = ?, is_hidden = ?, meta_title = ?, meta_description = ?,
             images = ?, updated_at = datetime('now')
         WHERE id = ? AND source = 'manual'`
      ).run(
        name,
        code,
        description,
        tags,
        categoryId,
        isFeatured,
        isHidden,
        metaTitle,
        metaDescription,
        JSON.stringify(imageResult.value),
        productId
      );

      let nextId = nextManualId("variants");
      const updateVariant = db.prepare(
        `UPDATE variants
         SET attr_name = ?, images = ?, price = ?, stock = ?, is_hidden = ?,
             price_source = ?,
             price_updated_at = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END,
             updated_at = datetime('now')
         WHERE id = ? AND product_id = ? AND source = 'manual'`
      );
      const insertVariant = db.prepare(
        `INSERT INTO variants
           (id, product_id, attr_group, attr_name, images, price, net_price,
            discount, stock, price_updated_at, price_source, is_hidden, active,
            source, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, NULL, NULL, ?,
                 CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END,
                 ?, ?, 1, 'manual', datetime('now'))`
      );

      const kept = new Set<number>();
      for (const variant of variants) {
        const priceSource = variant.price === null ? null : "manual";
        if (variant.id !== undefined && existingIds.has(variant.id)) {
          kept.add(variant.id);
          updateVariant.run(
            variant.name,
            JSON.stringify(variant.images),
            variant.price,
            variant.stock,
            variant.isHidden ? 1 : 0,
            priceSource,
            variant.price,
            variant.id,
            productId
          );
        } else {
          insertVariant.run(
            nextId++,
            productId,
            variant.name,
            JSON.stringify(variant.images),
            variant.price,
            variant.stock,
            variant.price,
            priceSource,
            variant.isHidden ? 1 : 0
          );
        }
      }

      const removeVariant = db.prepare(
        "DELETE FROM variants WHERE id = ? AND product_id = ? AND source = 'manual'"
      );
      for (const row of existingRows) {
        if (!kept.has(row.id)) removeVariant.run(row.id, productId);
      }
    }).immediate();
  } catch (error) {
    return { error: (error as Error).message };
  }

  const usedImages = new Set(variants.flatMap((variant) => variant.images));
  const removedImages = existingRows
    .flatMap((row) => parseImages(row.images))
    .filter(
      (url) => isProductImageUrl(url) && !usedImages.has(url)
    );
  await deleteUnreferencedProductImages(removedImages);

  updateTag("catalog");
  return {
    ok: true,
    message: "Ürün ve varyantlar güncellendi.",
    nonce: crypto.randomUUID(),
  };
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
  const showOnHome = formData.get("showOnHome") === "on" ? 1 : 0;
  const metaTitle = parseMeta(formData.get("metaTitle"));
  const metaDescription = parseMeta(formData.get("metaDescription"));
  const removeImage = formData.get("removeImage") === "on";
  const file = formData.get("image");

  let newImage: string | null = null;

  try {
    if (file instanceof File && file.size > 0) {
      newImage = await saveCategoryImage(file);
    }

    const imageUrl = newImage ?? (removeImage ? null : existing.image_url);

    db.prepare(
      `UPDATE categories
       SET image_url = ?, sort_order = ?, active = ?, show_on_home = ?,
           meta_title = ?, meta_description = ?
       WHERE id = ?`
    ).run(
      imageUrl,
      sortOrder,
      active,
      showOnHome,
      metaTitle,
      metaDescription,
      categoryId
    );

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

export async function updateCategoryBulkAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const raw = formData.get("updates");
  if (typeof raw !== "string" || raw.trim() === "") {
    return { error: "Güncellenecek kategori bulunamadı." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Geçersiz veri gönderildi." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "Güncellenecek kategori bulunamadı." };
  }

  const updates: { id: number; sortOrder: number; showOnHome: number }[] = [];
  for (const item of parsed) {
    const record = item as {
      id?: unknown;
      sortOrder?: unknown;
      showOnHome?: unknown;
    } | null;
    const id = Number(record?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return { error: "Geçersiz kategori gönderildi." };
    }
    const sortOrder = Number(record?.sortOrder ?? 0) || 0;
    if (!Number.isFinite(sortOrder)) {
      return { error: "Geçersiz sıra değeri gönderildi." };
    }
    updates.push({
      id,
      sortOrder,
      showOnHome: record?.showOnHome === true ? 1 : 0,
    });
  }

  try {
    const run = db.transaction(() => {
      const update = db.prepare(
        "UPDATE categories SET sort_order = ?, show_on_home = ? WHERE id = ?"
      );
      for (const updateRow of updates) {
        update.run(updateRow.sortOrder, updateRow.showOnHome, updateRow.id);
      }
    });
    run();
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("catalog");
  return {
    ok: true,
    message: `${updates.length} kategori güncellendi.`,
    nonce: crypto.randomUUID(),
  };
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

export async function saveVatRateAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const raw = String(formData.get("vatRate") ?? "")
    .trim()
    .replace(",", ".");
  const rate = raw === "" ? Number.NaN : Number(raw);
  if (!VAT_RATES.includes(rate as (typeof VAT_RATES)[number])) {
    return { error: "Geçerli bir KDV oranı seçin." };
  }
  setSetting(VAT_RATE_SETTING_KEY, String(rate));
  return { ok: true, message: `KDV oranı %${rate} olarak kaydedildi.` };
}

export async function saveGoogleTagAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const raw = String(formData.get("googleTagId") ?? "").trim();

  if (!raw) {
    setSetting(GOOGLE_TAG_SETTING_KEY, "");
    updateTag("settings");
    return { ok: true, message: "Google Analytics etiketi kaldırıldı." };
  }

  const tag = parseGoogleTagId(raw);
  if (!tag) {
    return {
      error:
        "Geçerli bir GTM (GTM-XXXXXXX) veya GA4 (G-XXXXXXXXXX) kimliği girin.",
    };
  }

  setSetting(GOOGLE_TAG_SETTING_KEY, tag.id);
  updateTag("settings");
  return { ok: true, message: `${tag.id} kaydedildi.` };
}

export async function saveWhatsAppSettingsAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const rawNumber = String(formData.get("whatsappNumber") ?? "").trim();
  const title = String(formData.get("whatsappTitle") ?? "").trim();
  const welcome = String(formData.get("whatsappWelcome") ?? "").trim();
  const enabled = formData.get("whatsappEnabled") === "on";

  const number = rawNumber ? normalizeWhatsAppNumber(rawNumber) : null;
  if (rawNumber && !number) {
    return {
      error:
        "Geçerli bir WhatsApp numarası girin. Ülke koduyla yazın; örnek: 905551234567 veya +90 555 123 45 67.",
    };
  }
  if (enabled && !number) {
    return {
      error:
        "WhatsApp destek hattını açmak için önce geçerli bir telefon numarası girin.",
    };
  }
  if (title.length > 60) {
    return { error: "Başlık en fazla 60 karakter olabilir." };
  }
  if (welcome.length > 1000) {
    return { error: "Karşılama mesajı en fazla 1000 karakter olabilir." };
  }

  setSetting(WHATSAPP_NUMBER_SETTING_KEY, number ?? "");
  setSetting(WHATSAPP_TITLE_SETTING_KEY, title);
  setSetting(WHATSAPP_WELCOME_SETTING_KEY, welcome);
  setSetting(WHATSAPP_ENABLED_SETTING_KEY, enabled ? "1" : "0");
  updateTag("settings");

  if (!enabled) {
    return {
      ok: true,
      message:
        "WhatsApp destek hattı kapatıldı; site üzerinde gösterilmiyor.",
      nonce: crypto.randomUUID(),
    };
  }

  if (!number) {
    return {
      ok: true,
      message: "WhatsApp destek hattı kapatıldı; sitede gösterilmiyor.",
      nonce: crypto.randomUUID(),
    };
  }

  return {
    ok: true,
    message: `WhatsApp destek hattı ${formatWhatsAppNumber(number)} numarasına yönlendirildi.`,
    nonce: crypto.randomUUID(),
  };
}

export async function saveQuoteContactAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const rawPhone = String(formData.get("quotePhone") ?? "").trim();
  const rawEmail = String(formData.get("quoteEmail") ?? "").trim();

  const phone = rawPhone ? normalizePhoneNumber(rawPhone) : null;
  if (rawPhone && !phone) {
    return {
      error:
        "Geçerli bir telefon numarası girin. Örnek: 0212 123 45 67 veya +90 555 123 45 67.",
    };
  }
  if (rawEmail && !z.email().safeParse(rawEmail).success) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  setSetting(QUOTE_PHONE_SETTING_KEY, phone ?? "");
  setSetting(QUOTE_EMAIL_SETTING_KEY, rawEmail);
  updateTag("settings");

  return {
    ok: true,
    message: "Teklif iletişim bilgileri kaydedildi.",
    nonce: crypto.randomUUID(),
  };
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

export async function saveMailSettingsAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const part of String(formData.get("recipients") ?? "").split(/[\n,;]+/)) {
    const email = part.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      recipients.push(email);
    }
  }
  const parsedRecipients = z.array(z.email()).max(20).safeParse(recipients);
  if (!parsedRecipients.success) {
    return {
      error:
        "Alıcı listesinde geçersiz e-posta adresi var veya 20 adres sınırı aşıldı.",
    };
  }

  const host = String(formData.get("host") ?? "").trim();
  const port = Number(String(formData.get("port") ?? "").trim());
  const secure = formData.get("secure") === "on";
  const user = String(formData.get("user") ?? "").trim();
  const pass = String(formData.get("pass") ?? "").trim();
  const fromName =
    String(formData.get("fromName") ?? "").trim() || "Kurumsal Promo";
  const parsedFromAddress = z
    .email()
    .safeParse(String(formData.get("fromAddress") ?? "").trim());

  if (!host) return { error: "SMTP sunucu adresi gerekli." };
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: "Geçerli bir SMTP portu girin (1-65535)." };
  }
  if (!user) return { error: "SMTP kullanıcı adı gerekli." };
  if (!parsedFromAddress.success) {
    return { error: "Geçerli bir gönderici e-posta adresi girin." };
  }

  const effectivePass = pass || getMailSettings()?.pass || "";
  if (!effectivePass) return { error: "SMTP şifresi gerekli." };

  const settings: MailSettings = {
    host,
    port,
    secure,
    user,
    pass: effectivePass,
    fromName,
    fromAddress: parsedFromAddress.data,
    recipients: parsedRecipients.data,
  };
  setSetting(MAIL_SETTINGS_KEY, JSON.stringify(settings));
  return { ok: true, message: "Mail ayarları kaydedildi." };
}

export async function sendTestMailAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const settings = getMailSettings();
  if (!settings) return { error: "Önce mail ayarlarını kaydedin." };

  const testTo = String(formData.get("testTo") ?? "").trim();
  let targets = settings.recipients;
  if (testTo) {
    const parsed = z.email().safeParse(testTo);
    if (!parsed.success) {
      return { error: "Geçerli bir test e-posta adresi girin." };
    }
    targets = [parsed.data];
  }
  if (targets.length === 0) {
    return {
      error:
        "Alıcı adresi yok. Bir test adresi yazın veya alıcı listesine adres ekleyin.",
    };
  }

  try {
    await sendTestMail(targets.join(", "));
    return { ok: true, message: `Test maili gönderildi: ${targets.join(", ")}` };
  } catch (error) {
    return {
      error: `Test maili gönderilemedi: ${(error as Error).message}`,
    };
  }
}
