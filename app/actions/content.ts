"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminActionState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";
import type { MenuItemType } from "@/lib/types";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "arama",
  "giris",
  "hesabim",
  "kategori",
  "kayit",
  "sepet",
  "urun",
  "urunler",
]);

const MENU_TYPES = new Set<MenuItemType>(["link", "page", "categories"]);

function isValidHref(href: string): boolean {
  if (href.startsWith("/")) return !href.startsWith("//");
  return /^https?:\/\//i.test(href);
}

function safeReturnTo(raw: string, fallback: string): string {
  const value = raw.trim();
  return value.startsWith("/admin") ? value : fallback;
}

export async function savePageAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const id = Number(formData.get("pageId") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || title);
  const metaTitle = String(formData.get("metaTitle") ?? "").trim() || null;
  const metaDescription =
    String(formData.get("metaDescription") ?? "").trim() || null;
  const content = sanitizeRichText(String(formData.get("content") ?? ""));
  const active = formData.get("active") === "on" ? 1 : 0;
  const returnTo = safeReturnTo(
    String(formData.get("returnTo") ?? ""),
    "/admin/sayfalar"
  );

  if (!title) return { error: "Sayfa başlığı gerekli." };
  if (!slug) return { error: "Geçerli bir adres (slug) girin." };
  if (RESERVED_SLUGS.has(slug)) {
    return {
      error:
        "Bu adres kod tarafında kullanılıyor. Mevcut rotaya menüden bağlantı verin veya farklı bir adres seçin.",
    };
  }

  const duplicate = db
    .prepare("SELECT id FROM pages WHERE slug = ? AND id != ?")
    .get(slug, id > 0 ? id : 0) as { id: number } | undefined;
  if (duplicate) return { error: "Bu adres başka bir sayfada kullanılıyor." };

  try {
    if (id > 0) {
      const existing = db
        .prepare("SELECT id FROM pages WHERE id = ?")
        .get(id) as { id: number } | undefined;
      if (!existing) return { error: "Sayfa bulunamadı." };

      db.prepare(
        `UPDATE pages
         SET slug = ?, title = ?, content = ?, meta_title = ?, meta_description = ?,
             active = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(slug, title, content, metaTitle, metaDescription, active, id);
    } else {
      db.prepare(
        `INSERT INTO pages (slug, title, content, meta_title, meta_description, active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(slug, title, content, metaTitle, metaDescription, active);
    }
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("pages");
  updateTag("menu");
  redirect(returnTo);
}

export async function deletePageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("pageId"));
  if (!Number.isInteger(id) || id <= 0) return;

  const references = db
    .prepare("SELECT COUNT(*) AS total FROM menu_items WHERE page_id = ?")
    .get(id) as { total: number };
  if (references.total > 0) {
    redirect(
      `/admin/sayfalar?hata=${encodeURIComponent(
        "Bu sayfa menüde kullanılıyor. Önce ilgili menü öğesini kaldırın."
      )}`
    );
  }

  db.prepare("DELETE FROM pages WHERE id = ?").run(id);
  updateTag("pages");
  updateTag("menu");
  redirect("/admin/sayfalar?mesaj=" + encodeURIComponent("Sayfa silindi."));
}

export async function saveMenuItemAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const id = Number(formData.get("menuItemId") ?? 0);
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "link") as MenuItemType;
  const hrefInput = String(formData.get("href") ?? "").trim();
  const pageId = Number(formData.get("pageId") ?? 0);
  const openInNewTab = formData.get("openInNewTab") === "on" ? 1 : 0;
  const active = formData.get("active") === "on" ? 1 : 0;

  if (!label) return { error: "Menü etiketi gerekli." };
  if (!MENU_TYPES.has(type)) return { error: "Geçersiz menü türü." };

  let href: string | null = null;
  let linkedPageId: number | null = null;

  if (type === "link") {
    if (!hrefInput) return { error: "Bağlantı adresi gerekli." };
    if (!isValidHref(hrefInput)) {
      return {
        error: "Geçerli bir adres girin: /sayfa-adi veya https://...",
      };
    }
    href = hrefInput;
  } else if (type === "page") {
    if (!Number.isInteger(pageId) || pageId <= 0) {
      return { error: "Lütfen bir sayfa seçin." };
    }
    const page = db
      .prepare("SELECT id, slug FROM pages WHERE id = ?")
      .get(pageId) as { id: number; slug: string } | undefined;
    if (!page) return { error: "Seçilen sayfa bulunamadı." };
    linkedPageId = page.id;
    href = `/${page.slug}`;
  }

  try {
    if (id > 0) {
      const existing = db
        .prepare("SELECT id FROM menu_items WHERE id = ?")
        .get(id) as { id: number } | undefined;
      if (!existing) return { error: "Menü öğesi bulunamadı." };

      db.prepare(
        `UPDATE menu_items
         SET label = ?, type = ?, href = ?, page_id = ?, open_in_new_tab = ?, active = ?
         WHERE id = ?`
      ).run(
        label,
        type,
        href,
        linkedPageId,
        openInNewTab,
        active,
        id
      );
    } else {
      const { next } = db
        .prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM menu_items"
        )
        .get() as { next: number };
      db.prepare(
        `INSERT INTO menu_items
           (label, type, href, page_id, open_in_new_tab, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(label, type, href, linkedPageId, openInNewTab, next, active);
    }
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("menu");
  return {
    ok: true,
    message: id > 0 ? "Menü öğesi güncellendi." : "Menü öğesi eklendi.",
    nonce: crypto.randomUUID(),
  };
}

export async function deleteMenuItemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("menuItemId"));
  if (!Number.isInteger(id) || id <= 0) return;
  db.prepare("DELETE FROM menu_items WHERE id = ?").run(id);
  updateTag("menu");
}

export async function toggleMenuItemActiveAction(
  menuItemId: number,
  active: boolean
): Promise<void> {
  await requireAdmin();
  if (!Number.isInteger(menuItemId) || menuItemId <= 0) return;
  db.prepare("UPDATE menu_items SET active = ? WHERE id = ?").run(
    active ? 1 : 0,
    menuItemId
  );
  updateTag("menu");
}

export async function reorderMenuItemsAction(
  menuItemIds: number[]
): Promise<void> {
  await requireAdmin();
  if (
    !Array.isArray(menuItemIds) ||
    menuItemIds.length === 0 ||
    menuItemIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(menuItemIds).size !== menuItemIds.length
  ) {
    return;
  }

  const update = db.prepare(
    "UPDATE menu_items SET sort_order = ? WHERE id = ?"
  );
  db.transaction(() => {
    menuItemIds.forEach((id, index) => update.run(index, id));
  })();
  updateTag("menu");
}
