"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getCart, saveCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { sendOrderQuoteEmail } from "@/lib/mail";

const ORDER_COOLDOWN_SECONDS = 60;
const HOURLY_ORDER_LIMIT = 5;
const OPEN_ORDER_LIMIT = 3;
const idempotencyKeySchema = z.uuid();

type CartVariant = {
  id: number;
  attr_name: string | null;
  price: number | null;
  product_name: string;
  code: string;
};

export type OrderFormState = { error?: string };

type OrderCreationResult = { orderId: number } | { error: string };

function findOrderIdByIdempotencyKey(
  userId: number,
  idempotencyKey: string
): number | undefined {
  const row = db
    .prepare(
      "SELECT id FROM orders WHERE user_id = ? AND idempotency_key = ?"
    )
    .get(userId, idempotencyKey) as { id: number } | undefined;
  return row?.id;
}

export async function createOrderAction(
  _prevState: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=%2Fsepet");

  const parsedKey = idempotencyKeySchema.safeParse(
    formData.get("idempotencyKey")
  );
  if (!parsedKey.success) {
    return { error: "Sipariş oturumu geçersiz. Sayfayı yenileyip tekrar deneyin." };
  }
  const idempotencyKey = parsedKey.data;

  const existingOrderId = findOrderIdByIdempotencyKey(user.id, idempotencyKey);
  if (existingOrderId !== undefined) {
    await saveCart({});
    redirect(`/hesabim/siparisler?olustu=${existingOrderId}`);
  }

  const cart = await getCart();
  const variantIds = Object.keys(cart)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  if (variantIds.length === 0) return { error: "Sepetiniz boş." };

  const placeholders = variantIds.map(() => "?").join(", ");
  const variants = db
    .prepare(
      `SELECT v.id, v.attr_name, v.price, p.name AS product_name, p.code
       FROM variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.id IN (${placeholders})
         AND v.active = 1 AND v.is_hidden = 0
         AND p.active = 1 AND p.is_hidden = 0`
    )
    .all(...variantIds) as CartVariant[];

  if (variants.length === 0) {
    return { error: "Sepetinizdeki ürünler artık satışta değil." };
  }

  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 1000);

  const allPriced = variants.every((variant) => variant.price !== null);
  const total = allPriced
    ? variants.reduce(
        (sum, variant) => sum + (variant.price ?? 0) * (cart[String(variant.id)] ?? 1),
        0
      )
    : null;

  const result = db.transaction((): OrderCreationResult => {
    const duplicateOrderId = findOrderIdByIdempotencyKey(
      user.id,
      idempotencyKey
    );
    if (duplicateOrderId !== undefined) return { orderId: duplicateOrderId };

    const nowSeconds = Math.floor(Date.now() / 1000);
    const latestOrder = db
      .prepare(
        `SELECT CAST(strftime('%s', created_at) AS INTEGER) AS created_at
         FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 1`
      )
      .get(user.id) as { created_at: number } | undefined;
    if (latestOrder) {
      const remainingSeconds =
        ORDER_COOLDOWN_SECONDS - (nowSeconds - latestOrder.created_at);
      if (remainingSeconds > 0) {
        return {
          error: `Yeni sipariş oluşturmak için ${remainingSeconds} saniye beklemelisiniz.`,
        };
      }
    }

    const hourlyOrders = db
      .prepare(
        `SELECT COUNT(*) AS count,
                CAST(strftime('%s', MIN(created_at)) AS INTEGER) AS oldest_created_at
         FROM orders
         WHERE user_id = ? AND created_at >= datetime('now', '-1 hour')`
      )
      .get(user.id) as { count: number; oldest_created_at: number };
    if (hourlyOrders.count >= HOURLY_ORDER_LIMIT) {
      const remainingSeconds = Math.max(
        1,
        hourlyOrders.oldest_created_at + 3600 - nowSeconds
      );
      return {
        error: `Saatlik sipariş sınırına ulaştınız. Yaklaşık ${Math.ceil(remainingSeconds / 60)} dakika sonra tekrar deneyin.`,
      };
    }

    const openOrders = db
      .prepare(
        `SELECT COUNT(*) AS count FROM orders
         WHERE user_id = ? AND status IN ('yeni', 'iletisimde')`
      )
      .get(user.id) as { count: number };
    if (openOrders.count >= OPEN_ORDER_LIMIT) {
      return {
        error: `${OPEN_ORDER_LIMIT} açık siparişiniz bulunuyor. Mevcut talepleriniz sonuçlandığında yeni sipariş oluşturabilirsiniz.`,
      };
    }

    const info = db
      .prepare(
        `INSERT INTO orders (user_id, idempotency_key, status, note, total)
         VALUES (?, ?, 'yeni', ?, ?)`
      )
      .run(user.id, idempotencyKey, note || null, total);
    const orderId = Number(info.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, variant_id, product_name, variant_name, product_code, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const variant of variants) {
      insertItem.run(
        orderId,
        variant.id,
        variant.product_name,
        variant.attr_name,
        variant.code,
        variant.price,
        cart[String(variant.id)] ?? 1
      );
    }
    return { orderId };
  }).immediate();

  if ("error" in result) return { error: result.error };

  const orderId = result.orderId;
  after(async () => {
    try {
      await sendOrderQuoteEmail(orderId);
    } catch (error) {
      console.error("[mail] teklif maili gönderilemedi", error);
    }
  });

  await saveCart({});
  redirect(`/hesabim/siparisler?olustu=${result.orderId}`);
}
