import { getSetting } from "./db";
import {
  CATALOG_SETTING_KEY,
  DEFAULT_CATALOG_SETTINGS,
  type CatalogSettings,
} from "./catalog";

export function readCatalogSettings(): CatalogSettings {
  const value = getSetting(CATALOG_SETTING_KEY);
  return value ? JSON.parse(value) as CatalogSettings : { ...DEFAULT_CATALOG_SETTINGS };
}
