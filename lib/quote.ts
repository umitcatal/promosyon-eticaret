import { buildWhatsAppChatUrl } from "./whatsapp";

export const QUOTE_PHONE_HOURS = "09:00 - 18:00";

export type QuoteRequest = {
  productName: string;
  variantName: string | null;
  quantity: number;
  categoryName: string | null;
};

export type QuoteContact = {
  phone: string | null;
  email: string | null;
};

export type QuoteChannels = QuoteContact & {
  whatsappNumber: string | null;
};

export function buildQuoteMessage(
  request: QuoteRequest,
  format: "whatsapp" | "plain" = "whatsapp"
): string {
  const bold = (text: string) => (format === "whatsapp" ? `*${text}*` : text);
  const lines = [bold("Toptan Fiyat Teklifi Talebi"), ""];

  lines.push(`${bold("Ürün:")} ${request.productName}`);
  if (request.variantName) {
    lines.push(`${bold("Varyant:")} ${request.variantName}`);
  }
  lines.push(`${bold("Miktar:")} ${request.quantity} adet`);
  if (request.categoryName) {
    lines.push(`${bold("Kategori:")} ${request.categoryName}`);
  }

  lines.push("", "Bu ürün için toptan fiyat teklifi almak istiyorum.");
  return lines.join("\n");
}

export function buildQuoteWhatsAppUrl(
  number: string,
  request: QuoteRequest
): string {
  return buildWhatsAppChatUrl(number, buildQuoteMessage(request));
}

export function buildQuoteMailtoUrl(
  email: string,
  request: QuoteRequest
): string {
  const subject = `Toptan Fiyat Teklifi Talebi - ${request.productName}`;
  const body = buildQuoteMessage(request, "plain");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * WhatsApp normalizasyonundan farklı olarak sabit hatları da (0212...)
 * ülke koduna taşır; tel: bağlantıları için kullanılır.
 */
export function normalizePhoneNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `90${digits}`;

  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function formatPhoneNumber(number: string): string {
  if (number.startsWith("90") && number.length === 12) {
    return `+90 ${number.slice(2, 5)} ${number.slice(5, 8)} ${number.slice(8, 10)} ${number.slice(10)}`;
  }
  return `+${number}`;
}