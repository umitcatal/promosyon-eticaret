import { getSiteSetting } from "./site-settings";
import {
  DEFAULT_THEME,
  isThemePresetId,
  normalizeHex,
  THEME_PRESETS,
  type ThemeSelection,
} from "./theme";

export const THEME_PRESET_KEY = "theme_preset";
export const THEME_PRIMARY_KEY = "theme_primary_color";
export const THEME_ACCENT_KEY = "theme_accent_color";

export type SiteTheme = ThemeSelection;

function presetFallback(preset: SiteTheme["preset"]) {
  return preset === "custom" ? DEFAULT_THEME : THEME_PRESETS[preset];
}

export function readSiteTheme(siteId: number): SiteTheme {
  const storedPreset = getSiteSetting(siteId, THEME_PRESET_KEY)?.trim() ?? "";
  const preset = isThemePresetId(storedPreset) ? storedPreset : "1";
  const fallback = presetFallback(preset);

  return {
    preset,
    primary:
      normalizeHex(getSiteSetting(siteId, THEME_PRIMARY_KEY)) ??
      fallback.primary,
    accent:
      normalizeHex(getSiteSetting(siteId, THEME_ACCENT_KEY)) ?? fallback.accent,
  };
}
