"use server";

import { updateTag } from "next/cache";
import type { AdminActionState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  clampItemLimit,
  DEFAULT_PROCESS_STEPS,
  HOME_WIDGET_META,
  isBannerAspect,
  isBannerLayout,
  isBannerWidth,
  isHomeWidgetType,
  isValidHref,
  normalizeCollectionConfig,
  normalizeProcessSteps,
} from "@/lib/home-widgets";
import { sanitizeRichText } from "@/lib/sanitize";
import type {
  CollectionWidgetConfig,
  HomeWidgetBanner,
  HomeWidgetRow,
  HomeWidgetType,
} from "@/lib/types";
import {
  deleteHomeBannerImage,
  saveHomeBannerImage,
} from "@/lib/uploads";

function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function defaultItemLimit(type: HomeWidgetType): number {
  const fallback = HOME_WIDGET_META[type].defaults.item_limit;
  if (
    type === "featured_products" ||
    type === "new_products" ||
    type === "collection"
  ) {
    return clampItemLimit(fallback, 8, 1, 24);
  }
  return fallback;
}

function readCollectionConfig(
  formData: FormData
): CollectionWidgetConfig | undefined {
  return normalizeCollectionConfig({
    collectionId: Number(formData.get("collectionId") ?? 0),
    perViewDesktop: Number(formData.get("perViewDesktop") ?? 4),
    perViewMobile: Number(formData.get("perViewMobile") ?? 2),
    mobileLayout: String(formData.get("mobileLayout") ?? "slider"),
    autoplay: formData.get("autoplay") === "on",
    autoplayInterval: Number(formData.get("autoplayInterval") ?? 5),
    slideStep: String(formData.get("slideStep") ?? "page"),
  });
}

function collectionExists(collectionId: number): boolean {
  return Boolean(
    db.prepare("SELECT id FROM collections WHERE id = ?").get(collectionId)
  );
}

export async function createHomeWidgetAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const rawType = String(formData.get("type") ?? "");
  if (!isHomeWidgetType(rawType)) {
    return { error: "Geçersiz widget türü." };
  }
  const type = rawType;
  const meta = HOME_WIDGET_META[type];

  const rawLayout = Number(formData.get("bannerLayout") ?? 1);
  const bannerLayout =
    type === "banner" && isBannerLayout(rawLayout) ? rawLayout : 1;
  const rawAspect = String(formData.get("aspect") ?? "wide");
  const aspect =
    type === "banner" && isBannerAspect(rawAspect) ? rawAspect : "wide";
  const rawWidth = String(formData.get("bannerWidth") ?? "container");
  const bannerWidth =
    type === "banner" && isBannerWidth(rawWidth) ? rawWidth : "container";

  let collectionConfig: CollectionWidgetConfig | undefined;
  if (type === "collection") {
    collectionConfig = readCollectionConfig(formData);
    if (!collectionConfig) return { error: "Koleksiyon seçin." };
    if (!collectionExists(collectionConfig.collectionId)) {
      return { error: "Koleksiyon bulunamadı." };
    }
  }

  const config =
    type === "process"
      ? JSON.stringify({ steps: DEFAULT_PROCESS_STEPS })
      : type === "seo_text"
        ? JSON.stringify({
            seo: { content: "", collapsedByDefault: true },
          })
        : type === "collection" && collectionConfig
          ? JSON.stringify({ collection: collectionConfig })
          : "{}";

  try {
    db.transaction(() => {
      const { next } = db
        .prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM home_widgets"
        )
        .get() as { next: number };

      db.prepare(
        `INSERT INTO home_widgets
           (type, eyebrow, title, subtitle, link, link_label, banner_layout, aspect, banner_width, item_limit, config, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        type,
        meta.defaults.eyebrow,
        meta.defaults.title,
        meta.defaults.subtitle,
        meta.defaults.link,
        meta.defaults.link_label,
        bannerLayout,
        aspect,
        bannerWidth,
        defaultItemLimit(type),
        config,
        next
      );
    })();
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("homepage");
  return {
    ok: true,
    message: `${meta.label} eklendi.`,
    nonce: crypto.randomUUID(),
  };
}

export async function updateHomeWidgetAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const widgetId = Number(formData.get("widgetId"));
  if (!Number.isInteger(widgetId) || widgetId <= 0) {
    return { error: "Geçersiz widget." };
  }

  const existing = db
    .prepare("SELECT * FROM home_widgets WHERE id = ?")
    .get(widgetId) as HomeWidgetRow | undefined;
  if (!existing || !isHomeWidgetType(existing.type)) {
    return { error: "Widget bulunamadı." };
  }
  const type = existing.type;

  const eyebrow = textOrNull(formData.get("eyebrow"));
  const title = textOrNull(formData.get("title"));
  const subtitle = textOrNull(formData.get("subtitle"));
  const link = textOrNull(formData.get("link"));
  const linkLabel = textOrNull(formData.get("link_label"));

  if (link && !isValidHref(link)) {
    return { error: "Geçerli bir bağlantı girin: /sayfa-adi veya https://..." };
  }

  let bannerLayout = isBannerLayout(existing.banner_layout)
    ? existing.banner_layout
    : 1;
  let aspect = isBannerAspect(existing.aspect) ? existing.aspect : "wide";
  let bannerWidth = isBannerWidth(existing.banner_width)
    ? existing.banner_width
    : "container";

  if (type === "banner") {
    const rawLayout = Number(formData.get("bannerLayout"));
    if (!isBannerLayout(rawLayout)) {
      return { error: "Geçersiz banner düzeni." };
    }
    bannerLayout = rawLayout;

    const rawAspect = String(formData.get("aspect") ?? "");
    if (!isBannerAspect(rawAspect)) {
      return { error: "Geçersiz banner oranı." };
    }
    aspect = rawAspect;

    const rawWidth = String(formData.get("bannerWidth") ?? "");
    if (!isBannerWidth(rawWidth)) {
      return { error: "Geçersiz banner genişliği." };
    }
    bannerWidth = rawWidth;
  }

  let collectionConfig: CollectionWidgetConfig | undefined;
  if (type === "collection") {
    collectionConfig = readCollectionConfig(formData);
    if (!collectionConfig) return { error: "Koleksiyon seçin." };
    if (!collectionExists(collectionConfig.collectionId)) {
      return { error: "Koleksiyon bulunamadı." };
    }
  }

  let itemLimit = existing.item_limit;
  if (type === "categories") {
    itemLimit = clampItemLimit(
      formData.get("itemLimit"),
      existing.item_limit,
      0,
      24
    );
  } else if (
    type === "featured_products" ||
    type === "new_products" ||
    type === "collection"
  ) {
    itemLimit = clampItemLimit(
      formData.get("itemLimit"),
      existing.item_limit > 0 ? existing.item_limit : 20,
      1,
      24
    );
  }

  let config = existing.config;
  if (type === "process") {
    const titles = formData.getAll("stepTitle");
    const descriptions = formData.getAll("stepDescription");
    const steps = normalizeProcessSteps(
      titles.map((value, index) => ({
        title: value,
        description: descriptions[index] ?? "",
      }))
    );
    if (steps.length === 0) {
      return { error: "En az bir süreç adımı gerekli." };
    }
    config = JSON.stringify({ steps });
  } else if (type === "seo_text") {
    config = JSON.stringify({
      seo: {
        content: sanitizeRichText(String(formData.get("seoContent") ?? "")),
        collapsedByDefault: formData.get("collapsedByDefault") === "on",
      },
    });
  } else if (type === "collection" && collectionConfig) {
    config = JSON.stringify({ collection: collectionConfig });
  }

  try {
    db.prepare(
      `UPDATE home_widgets
       SET eyebrow = ?, title = ?, subtitle = ?, link = ?, link_label = ?,
           banner_layout = ?, aspect = ?, banner_width = ?, item_limit = ?,
           config = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      eyebrow,
      title,
      subtitle,
      link,
      linkLabel,
      bannerLayout,
      aspect,
      bannerWidth,
      itemLimit,
      config,
      widgetId
    );
  } catch (error) {
    return { error: (error as Error).message };
  }

  updateTag("homepage");
  return {
    ok: true,
    message: "Widget güncellendi.",
    nonce: crypto.randomUUID(),
  };
}

export async function toggleHomeWidgetActiveAction(
  widgetId: number,
  active: boolean
): Promise<void> {
  await requireAdmin();
  if (!Number.isInteger(widgetId) || widgetId <= 0) return;

  db.prepare(
    "UPDATE home_widgets SET active = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(active ? 1 : 0, widgetId);
  updateTag("homepage");
}

export async function reorderHomeWidgetsAction(
  widgetIds: number[]
): Promise<void> {
  await requireAdmin();
  if (
    !Array.isArray(widgetIds) ||
    widgetIds.length === 0 ||
    widgetIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(widgetIds).size !== widgetIds.length
  ) {
    return;
  }

  const update = db.prepare(
    "UPDATE home_widgets SET sort_order = ? WHERE id = ?"
  );
  db.transaction(() => {
    widgetIds.forEach((id, index) => update.run(index, id));
  })();
  updateTag("homepage");
}

export async function deleteHomeWidgetAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const widgetId = Number(formData.get("widgetId"));
  if (!Number.isInteger(widgetId) || widgetId <= 0) return;

  const banners = db
    .prepare("SELECT image_url FROM home_widget_banners WHERE widget_id = ?")
    .all(widgetId) as { image_url: string }[];

  db.prepare("DELETE FROM home_widgets WHERE id = ?").run(widgetId);
  await Promise.all(
    banners.map((banner) => deleteHomeBannerImage(banner.image_url))
  );
  updateTag("homepage");
}

export async function saveHomeBannerAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

  const widgetId = Number(formData.get("widgetId"));
  const bannerId = Number(formData.get("bannerId") ?? 0);
  if (!Number.isInteger(widgetId) || widgetId <= 0) {
    return { error: "Geçersiz widget." };
  }
  if (!Number.isInteger(bannerId) || bannerId < 0) {
    return { error: "Geçersiz banner." };
  }

  const widget = db
    .prepare("SELECT id, type, banner_layout FROM home_widgets WHERE id = ?")
    .get(widgetId) as
    | { id: number; type: string; banner_layout: number }
    | undefined;
  if (!widget || widget.type !== "banner") {
    return { error: "Banner widget'ı bulunamadı." };
  }
  const layout = isBannerLayout(widget.banner_layout)
    ? widget.banner_layout
    : 1;

  const altText = textOrNull(formData.get("altText"));
  const link = textOrNull(formData.get("link"));
  if (link && !isValidHref(link)) {
    return { error: "Geçerli bir bağlantı girin: /sayfa-adi veya https://..." };
  }

  const openInNewTab = formData.get("openInNewTab") === "on" ? 1 : 0;
  const active = formData.get("active") === "on" ? 1 : 0;
  const file = formData.get("image");

  const existing =
    bannerId > 0
      ? (db
          .prepare(
            "SELECT * FROM home_widget_banners WHERE id = ? AND widget_id = ?"
          )
          .get(bannerId, widgetId) as HomeWidgetBanner | undefined)
      : undefined;
  if (bannerId > 0 && !existing) {
    return { error: "Banner bulunamadı." };
  }

  const hasNewImage = file instanceof File && file.size > 0;
  if (!existing && !hasNewImage) {
    return { error: "Lütfen bir görsel yükleyin." };
  }

  if (!existing) {
    const { total } = db
      .prepare(
        "SELECT COUNT(*) AS total FROM home_widget_banners WHERE widget_id = ?"
      )
      .get(widgetId) as { total: number };
    if (total >= layout) {
      return {
        error: `Bu düzen en fazla ${layout} görsel gösterebilir. Önce bir görsel silin veya düzeni artırın.`,
      };
    }
  }

  let newImage: string | null = null;
  try {
    if (hasNewImage) {
      newImage = await saveHomeBannerImage(file as File);
    }
    const imageUrl = newImage ?? existing?.image_url ?? null;
    if (!imageUrl) {
      return { error: "Lütfen bir görsel yükleyin." };
    }

    if (existing) {
      db.prepare(
        `UPDATE home_widget_banners
         SET image_url = ?, alt_text = ?, link = ?, open_in_new_tab = ?, active = ?
         WHERE id = ?`
      ).run(imageUrl, altText, link, openInNewTab, active, existing.id);
    } else {
      const { next } = db
        .prepare(
          `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next
           FROM home_widget_banners WHERE widget_id = ?`
        )
        .get(widgetId) as { next: number };

      db.prepare(
        `INSERT INTO home_widget_banners
           (widget_id, image_url, alt_text, link, open_in_new_tab, sort_order, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(widgetId, imageUrl, altText, link, openInNewTab, next, active);
    }

    if (existing && newImage && existing.image_url !== newImage) {
      await deleteHomeBannerImage(existing.image_url);
    }
  } catch (error) {
    if (newImage) await deleteHomeBannerImage(newImage);
    return { error: (error as Error).message };
  }

  updateTag("homepage");
  return {
    ok: true,
    message: existing ? "Banner güncellendi." : "Banner eklendi.",
    nonce: crypto.randomUUID(),
  };
}

export async function deleteHomeBannerAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const bannerId = Number(formData.get("bannerId"));
  if (!Number.isInteger(bannerId) || bannerId <= 0) return;

  const row = db
    .prepare("SELECT image_url FROM home_widget_banners WHERE id = ?")
    .get(bannerId) as { image_url: string } | undefined;
  db.prepare("DELETE FROM home_widget_banners WHERE id = ?").run(bannerId);
  if (row) await deleteHomeBannerImage(row.image_url);
  updateTag("homepage");
}

export async function reorderHomeBannersAction(
  widgetId: number,
  bannerIds: number[]
): Promise<void> {
  await requireAdmin();
  if (!Number.isInteger(widgetId) || widgetId <= 0) return;
  if (
    !Array.isArray(bannerIds) ||
    bannerIds.length === 0 ||
    bannerIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(bannerIds).size !== bannerIds.length
  ) {
    return;
  }

  const owned = new Set(
    (
      db
        .prepare("SELECT id FROM home_widget_banners WHERE widget_id = ?")
        .all(widgetId) as { id: number }[]
    ).map((row) => row.id)
  );
  if (bannerIds.some((id) => !owned.has(id))) return;

  const update = db.prepare(
    "UPDATE home_widget_banners SET sort_order = ? WHERE id = ?"
  );
  db.transaction(() => {
    bannerIds.forEach((id, index) => update.run(index, id));
  })();
  updateTag("homepage");
}
