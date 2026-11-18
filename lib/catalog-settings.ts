import { getSiteSetting } from "./site-settings";
import {
  CATALOG_SETTING_KEY,
  DEFAULT_CATALOG_SETTINGS,
  type CatalogSettings,
} from "./catalog";

export function readCatalogSettings(siteId: number): CatalogSettings {
  const value = getSiteSetting(siteId, CATALOG_SETTING_KEY);
  return value
    ? (JSON.parse(value) as CatalogSettings)
    : { ...DEFAULT_CATALOG_SETTINGS };
}
