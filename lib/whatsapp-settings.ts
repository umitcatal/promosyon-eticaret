import { getSetting } from "./db";
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

export function readWhatsAppSupport(): WhatsAppSupport {
  const number = normalizeWhatsAppNumber(
    getSetting(WHATSAPP_NUMBER_SETTING_KEY) ?? ""
  );
  const welcomeMessage =
    getSetting(WHATSAPP_WELCOME_SETTING_KEY)?.trim() ||
    DEFAULT_WHATSAPP_WELCOME;
  const title =
    getSetting(WHATSAPP_TITLE_SETTING_KEY)?.trim() || DEFAULT_WHATSAPP_TITLE;

  return {
    enabled: getSetting(WHATSAPP_ENABLED_SETTING_KEY) !== "0",
    number: number ?? "",
    title,
    welcomeMessage,
  };
}
