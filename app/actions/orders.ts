"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCart, saveCart } from "@/lib/cart";
import { db } from "@/lib/db";

type CartVariant = {
  id: number;
  attr_name: string | null;
  price: number | null;
  product_name: string;
  code: string;
};

export async function createOrderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=%2Fsepet");

  const cart = await getCart();
  const variantIds = Object.keys(cart)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
  if (variantIds.length === 0) redirect("/sepet");

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

  if (variants.length === 0) redirect("/sepet");

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

  const orderId = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO orders (user_id, status, note, total) VALUES (?, 'yeni', ?, ?)`
      )
      .run(user.id, note || null, total);
    const id = Number(info.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, variant_id, product_name, variant_name, product_code, unit_price, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const variant of variants) {
      insertItem.run(
        id,
        variant.id,
        variant.product_name,
        variant.attr_name,
        variant.code,
        variant.price,
        cart[String(variant.id)] ?? 1
      );
    }
    return id;
  })();

  await saveCart({});
  redirect(`/hesabim/siparisler?olustu=${orderId}`);
}
