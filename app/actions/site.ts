"use server";

import { cookies } from "next/headers";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { siteTag } from "@/lib/cache-tags";
import { ADMIN_SITE_COOKIE, getAdminSiteId } from "@/lib/site-request";
import { parseSiteId } from "@/lib/sites";
import {
  FAVICON_KEY,
  OG_IMAGE_KEY,
  SEO_DESCRIPTION_KEY,
  SEO_TITLE_KEY,
  SITE_NAME_KEY,
  getSiteFavicon,
  setSiteSetting,
} from "@/lib/site-settings";
import {
  THEME_ACCENT_KEY,
  THEME_PRESET_KEY,
  THEME_PRIMARY_KEY,
} from "@/lib/site-theme";
import { isThemePresetId, normalizeHex } from "@/lib/theme";
import { deleteFaviconImages, saveFaviconImages } from "@/lib/uploads";

export async function switchAdminSiteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const siteId = parseSiteId(String(formData.get("siteId") ?? ""));
  if (siteId === null) return;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SITE_COOKIE, String(siteId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/admin");
}

export type SiteIdentityState = {
  ok?: boolean;
  error?: string;
  message?: string;
  nonce?: string;
};

export async function saveSiteIdentityAction(
  _prev: SiteIdentityState,
  formData: FormData
): Promise<SiteIdentityState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const siteName = String(formData.get("siteName") ?? "").trim();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const ogImageUrl = String(formData.get("ogImageUrl") ?? "").trim();

  if (!siteName) return { error: "Site adı zorunludur." };
  if (
    ogImageUrl &&
    !(
      (ogImageUrl.startsWith("/") && !ogImageUrl.startsWith("//")) ||
      /^https?:\/\//i.test(ogImageUrl)
    )
  ) {
    return { error: "OG görseli /yol veya https://... biçiminde olmalıdır." };
  }

  setSiteSetting(siteId, SITE_NAME_KEY, siteName);
  setSiteSetting(siteId, SEO_TITLE_KEY, seoTitle || `${siteName} | Kurumsal Promosyon Ürünleri`);
  setSiteSetting(siteId, SEO_DESCRIPTION_KEY, seoDescription);
  setSiteSetting(siteId, OG_IMAGE_KEY, ogImageUrl);

  updateTag(siteTag(siteId, "settings"));
  updateTag("settings");
  refresh();

  return { ok: true, message: "Site kimliği kaydedildi." };
}

export async function saveSiteFaviconAction(
  _prev: SiteIdentityState,
  formData: FormData
): Promise<SiteIdentityState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const file = formData.get("favicon");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Lütfen bir favicon görseli seçin." };
  }

  const current = getSiteFavicon(siteId);

  try {
    const next = await saveFaviconImages(file);
    setSiteSetting(siteId, FAVICON_KEY, JSON.stringify(next));
    if (current) await deleteFaviconImages(current);
    updateTag(siteTag(siteId, "settings"));
    updateTag("settings");
    refresh();
    return {
      ok: true,
      message: "Favicon güncellendi.",
      nonce: crypto.randomUUID(),
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function removeSiteFaviconAction(): Promise<void> {
  await requireAdmin();
  const siteId = await getAdminSiteId();
  const current = getSiteFavicon(siteId);

  setSiteSetting(siteId, FAVICON_KEY, "");
  if (current) await deleteFaviconImages(current);
  updateTag(siteTag(siteId, "settings"));
  updateTag("settings");
  refresh();
}

export type ThemeActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

export async function saveThemeAction(
  _prev: ThemeActionState,
  formData: FormData
): Promise<ThemeActionState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const preset = String(formData.get("themePreset") ?? "").trim();
  if (!isThemePresetId(preset)) {
    return { error: "Geçersiz tema seçimi." };
  }

  const primary = normalizeHex(formData.get("themePrimary"));
  const accent = normalizeHex(formData.get("themeAccent"));

  if (preset === "custom" && (!primary || !accent)) {
    return {
      error:
        "Özel tema için ana renk ve vurgu rengi geçerli bir HEX değeri olmalıdır.",
    };
  }

  setSiteSetting(siteId, THEME_PRESET_KEY, preset);
  if (primary) setSiteSetting(siteId, THEME_PRIMARY_KEY, primary);
  if (accent) setSiteSetting(siteId, THEME_ACCENT_KEY, accent);

  updateTag(siteTag(siteId, "settings"));
  updateTag("settings");
  refresh();

  return { ok: true, message: "Tema kaydedildi." };
}
