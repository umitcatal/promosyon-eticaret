import { getSiteSetting } from "./site-settings";
import { getMailSettings } from "./mail";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
  type QuoteContact,
} from "./quote";
import { WHATSAPP_NUMBER_SETTING_KEY } from "./whatsapp";

export const QUOTE_PHONE_SETTING_KEY = "quote_phone";
export const CONTACT_LANDLINE_SETTING_KEY = "contact_landline";
export const QUOTE_EMAIL_SETTING_KEY = "quote_email";
export const CONTACT_ADDRESS_SETTING_KEY = "contact_address";

export type QuoteContactSettings = {
  phone: string;
  landline: string;
  email: string;
  address: string;
};

export type SiteContact = {
  phone: string | null;
  phoneDisplay: string | null;
  landline: string | null;
  landlineDisplay: string | null;
  email: string | null;
  address: string | null;
};

export function readQuoteContactSettings(
  siteId: number
): QuoteContactSettings {
  return {
    phone: getSiteSetting(siteId, QUOTE_PHONE_SETTING_KEY)?.trim() ?? "",
    landline: getSiteSetting(siteId, CONTACT_LANDLINE_SETTING_KEY)?.trim() ?? "",
    email: getSiteSetting(siteId, QUOTE_EMAIL_SETTING_KEY)?.trim() ?? "",
    address: getSiteSetting(siteId, CONTACT_ADDRESS_SETTING_KEY)?.trim() ?? "",
  };
}

export function readQuoteContact(siteId: number): QuoteContact {
  const settings = readQuoteContactSettings(siteId);
  const phone = normalizePhoneNumber(
    settings.phone || (getSiteSetting(siteId, WHATSAPP_NUMBER_SETTING_KEY) ?? "")
  );
  const email = settings.email || getMailSettings(siteId)?.recipients[0] || null;

  return { phone, email };
}

export function readSiteContact(siteId: number): SiteContact {
  const { phone, email } = readQuoteContact(siteId);
  const landline = normalizePhoneNumber(
    getSiteSetting(siteId, CONTACT_LANDLINE_SETTING_KEY)?.trim() ?? ""
  );

  return {
    phone,
    phoneDisplay: phone ? formatPhoneNumber(phone) : null,
    landline,
    landlineDisplay: landline ? formatPhoneNumber(landline) : null,
    email,
    address:
      getSiteSetting(siteId, CONTACT_ADDRESS_SETTING_KEY)?.trim() || null,
  };
}
