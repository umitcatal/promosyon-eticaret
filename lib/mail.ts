import nodemailer from "nodemailer";
import { z } from "zod";
import { db, getSetting } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderItemRow } from "@/lib/orders";

export const MAIL_SETTINGS_KEY = "mail_settings";

const mailSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().min(1),
  pass: z.string().min(1),
  fromName: z.string(),
  fromAddress: z.email(),
  recipients: z.array(z.email()).max(20),
});

export type MailSettings = z.infer<typeof mailSettingsSchema>;

export type MailSettingsPublic = Omit<MailSettings, "pass"> & {
  hasPass: boolean;
};

export function getMailSettings(): MailSettings | null {
  const raw = getSetting(MAIL_SETTINGS_KEY);
  if (!raw) return null;
  try {
    const parsed = mailSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getMailSettingsPublic(): MailSettingsPublic | null {
  const settings = getMailSettings();
  if (!settings) return null;
  const { pass, ...publicSettings } = settings;
  return { ...publicSettings, hasPass: pass.length > 0 };
}

function createMailTransport(settings: MailSettings) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type OrderMailRow = {
  id: number;
  note: string | null;
  total: number | null;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

function itemPriceLabel(item: OrderItemRow): string {
  return formatPrice(item.unit_price) ?? "Teklif";
}

function buildQuoteHtml(order: OrderMailRow, items: OrderItemRow[]): string {
  const customerName = `${order.first_name} ${order.last_name}`;
  const rows = items
    .map((item) => {
      const variant = item.variant_name
        ? `<div style="color:#52525b;font-size:12px;">${escapeHtml(item.variant_name)}</div>`
        : "";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;">${escapeHtml(item.product_name)}${variant}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;">${escapeHtml(item.product_code ?? "—")}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;text-align:right;">${escapeHtml(itemPriceLabel(item))}</td>
      </tr>`;
    })
    .join("");

  const noteBlock = order.note
    ? `<div style="margin-top:16px;padding:12px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;">
        <div style="font-size:12px;font-weight:600;color:#52525b;margin-bottom:4px;">Müşteri Notu</div>
        <div style="font-size:14px;color:#18181b;white-space:pre-wrap;">${escapeHtml(order.note)}</div>
      </div>`
    : "";

  return `<div style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;">
      <div style="font-size:18px;font-weight:bold;color:#18181b;">Yeni Sipariş Teklifi #${order.id}</div>
      <div style="margin-top:4px;font-size:13px;color:#52525b;">${escapeHtml(formatDateTime(order.created_at))} · Kurumsal Promo</div>

      <table style="margin-top:16px;width:100%;border-collapse:collapse;font-size:14px;color:#18181b;">
        <tr><td style="padding:4px 0;color:#52525b;width:120px;">Müşteri</td><td style="padding:4px 0;">${escapeHtml(customerName)}</td></tr>
        <tr><td style="padding:4px 0;color:#52525b;">E-posta</td><td style="padding:4px 0;">${escapeHtml(order.email)}</td></tr>
        <tr><td style="padding:4px 0;color:#52525b;">Telefon</td><td style="padding:4px 0;">${escapeHtml(order.phone ?? "—")}</td></tr>
      </table>

      <table style="margin-top:16px;width:100%;border-collapse:collapse;font-size:14px;color:#18181b;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:8px 12px;border-bottom:2px solid #e4e4e7;text-align:left;">Ürün</th>
            <th style="padding:8px 12px;border-bottom:2px solid #e4e4e7;text-align:left;">Kod</th>
            <th style="padding:8px 12px;border-bottom:2px solid #e4e4e7;text-align:center;">Adet</th>
            <th style="padding:8px 12px;border-bottom:2px solid #e4e4e7;text-align:right;">Birim Fiyat</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:8px 12px;font-weight:bold;">Toplam</td>
            <td style="padding:8px 12px;text-align:right;font-weight:bold;">${escapeHtml(formatPrice(order.total) ?? "Teklif talebi")}</td>
          </tr>
        </tfoot>
      </table>
      ${noteBlock}
    </div>
  </div>`;
}

function buildQuoteText(order: OrderMailRow, items: OrderItemRow[]): string {
  const lines = [
    `Yeni Sipariş Teklifi #${order.id}`,
    formatDateTime(order.created_at),
    "",
    `Müşteri: ${order.first_name} ${order.last_name}`,
    `E-posta: ${order.email}`,
    `Telefon: ${order.phone ?? "—"}`,
    "",
    ...items.map(
      (item) =>
        `- ${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""} | Kod: ${item.product_code ?? "—"} | Adet: ${item.quantity} | Birim: ${itemPriceLabel(item)}`
    ),
    "",
    `Toplam: ${formatPrice(order.total) ?? "Teklif talebi"}`,
  ];
  if (order.note) lines.push("", `Müşteri Notu: ${order.note}`);
  return lines.join("\n");
}

export async function sendOrderQuoteEmail(orderId: number): Promise<void> {
  const settings = getMailSettings();
  if (!settings || settings.recipients.length === 0) {
    console.info("[mail] mail ayarları veya alıcılar tanımlı değil, teklif maili atlandı");
    return;
  }

  const order = db
    .prepare(
      `SELECT o.id, o.note, o.total, o.created_at,
              u.first_name, u.last_name, u.email, u.phone
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = ?`
    )
    .get(orderId) as OrderMailRow | undefined;
  if (!order) throw new Error(`Sipariş bulunamadı: ${orderId}`);

  const items = db
    .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id")
    .all(orderId) as OrderItemRow[];

  const transporter = createMailTransport(settings);
  try {
    await transporter.sendMail({
      from: { name: settings.fromName, address: settings.fromAddress },
      to: settings.recipients.join(", "),
      subject: `Yeni Sipariş Teklifi #${order.id} — ${order.first_name} ${order.last_name}`,
      html: buildQuoteHtml(order, items),
      text: buildQuoteText(order, items),
    });
  } finally {
    transporter.close();
  }
}

export async function sendTestMail(to: string): Promise<void> {
  const settings = getMailSettings();
  if (!settings) {
    throw new Error("Mail ayarları kaydedilmemiş. Önce ayarları kaydedin.");
  }

  const transporter = createMailTransport(settings);
  try {
    await transporter.sendMail({
      from: { name: settings.fromName, address: settings.fromAddress },
      to,
      subject: "Kurumsal Promo — Test Maili",
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#18181b;">
        <p>Bu bir test mailidir. Kurumsal Promo sipariş teklifi bildirimleri bu SMTP ayarlarıyla gönderilecek.</p>
        <p style="color:#52525b;">${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
      </div>`,
      text: `Bu bir test mailidir. Kurumsal Promo sipariş teklifi bildirimleri bu SMTP ayarlarıyla gönderilecek.\n${formatDateTime(new Date().toISOString())}`,
    });
  } finally {
    transporter.close();
  }
}