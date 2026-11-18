import { getSiteSetting } from "./site-settings";
import {
  DEFAULT_WHATSAPP_TITLE,
  DEFAULT_WHATSAPP_WELCOME,
  normalizeWhatsAppNumber,
  WHATSAPP_ENABLED_SETTING_KEY,
  WHATSAPP_NUMBER_SETTING_KEY,
  WHATSAPP_TITLE_SETTING_KEY,
  WHATSAPP_WELCOME_SETTING_KEY,
  type WhatsAppSupport,
} from "./whatsapp";

export function readWhatsAppSupport(siteId: number): WhatsAppSupport {
  const number = normalizeWhatsAppNumber(
    getSiteSetting(siteId, WHATSAPP_NUMBER_SETTING_KEY) ?? ""
  );
  const welcomeMessage =
    getSiteSetting(siteId, WHATSAPP_WELCOME_SETTING_KEY)?.trim() ||
    DEFAULT_WHATSAPP_WELCOME;
  const title =
    getSiteSetting(siteId, WHATSAPP_TITLE_SETTING_KEY)?.trim() ||
    DEFAULT_WHATSAPP_TITLE;

  return {
    enabled: getSiteSetting(siteId, WHATSAPP_ENABLED_SETTING_KEY) !== "0",
    number: number ?? "",
    title,
    welcomeMessage,
  };
}
