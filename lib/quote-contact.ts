import { getSetting } from "./db";
import { getMailSettings } from "./mail";
import { normalizePhoneNumber, type QuoteContact } from "./quote";
import { WHATSAPP_NUMBER_SETTING_KEY } from "./whatsapp";

export const QUOTE_PHONE_SETTING_KEY = "quote_phone";
export const QUOTE_EMAIL_SETTING_KEY = "quote_email";

export type QuoteContactSettings = {
  phone: string;
  email: string;
};

export function readQuoteContactSettings(): QuoteContactSettings {
  return {
    phone: getSetting(QUOTE_PHONE_SETTING_KEY)?.trim() ?? "",
    email: getSetting(QUOTE_EMAIL_SETTING_KEY)?.trim() ?? "",
  };
}

export function readQuoteContact(): QuoteContact {
  const settings = readQuoteContactSettings();
  const phone = normalizePhoneNumber(
    settings.phone || (getSetting(WHATSAPP_NUMBER_SETTING_KEY) ?? "")
  );
  const email = settings.email || getMailSettings()?.recipients[0] || null;

  return { phone, email };
}