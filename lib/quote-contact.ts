import { getSetting } from "./db";
import { getMailSettings } from "./mail";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
  type QuoteContact,
} from "./quote";
import { WHATSAPP_NUMBER_SETTING_KEY } from "./whatsapp";

export const QUOTE_PHONE_SETTING_KEY = "quote_phone";
export const QUOTE_EMAIL_SETTING_KEY = "quote_email";
export const CONTACT_ADDRESS_SETTING_KEY = "contact_address";

export type QuoteContactSettings = {
  phone: string;
  email: string;
  address: string;
};

export type SiteContact = {
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  address: string | null;
};

export function readQuoteContactSettings(): QuoteContactSettings {
  return {
    phone: getSetting(QUOTE_PHONE_SETTING_KEY)?.trim() ?? "",
    email: getSetting(QUOTE_EMAIL_SETTING_KEY)?.trim() ?? "",
    address: getSetting(CONTACT_ADDRESS_SETTING_KEY)?.trim() ?? "",
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

export function readSiteContact(): SiteContact {
  const { phone, email } = readQuoteContact();

  return {
    phone,
    phoneDisplay: phone ? formatPhoneNumber(phone) : null,
    email,
    address: getSetting(CONTACT_ADDRESS_SETTING_KEY)?.trim() || null,
  };
}
