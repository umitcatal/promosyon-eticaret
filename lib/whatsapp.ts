export const WHATSAPP_NUMBER_SETTING_KEY = "whatsapp_number";
export const WHATSAPP_WELCOME_SETTING_KEY = "whatsapp_welcome_message";
export const WHATSAPP_TITLE_SETTING_KEY = "whatsapp_title";
export const WHATSAPP_ENABLED_SETTING_KEY = "whatsapp_enabled";

export const DEFAULT_WHATSAPP_TITLE = "WhatsApp Destek";
export const DEFAULT_WHATSAPP_WELCOME =
  "Merhaba. Kurumsal Promo'ya hoş geldiniz. Size nasıl yardımcı olabilirim?";

export type WhatsAppSupport = {
  enabled: boolean;
  number: string;
  title: string;
  welcomeMessage: string;
};

/**
 * Ülke kodlu, boşluksuz bir WhatsApp numarası döndürür. Türkiye'de yaygın
 * olarak yazılan "0555..." ve "555..." biçimleri otomatik olarak "90555..."
 * biçimine çevrilir. Geçersiz numaralarda null döner.
 */
export function normalizeWhatsAppNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `90${digits}`;
  }

  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function formatWhatsAppNumber(number: string): string {
  return number ? `+${number}` : "";
}

export function buildWhatsAppChatUrl(
  number: string,
  message?: string
): string {
  const base = `https://wa.me/${number}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
