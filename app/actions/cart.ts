"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCart, saveCart } from "@/lib/cart";

const addSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(999),
});

export async function addToCartAction(formData: FormData): Promise<void> {
  const parsed = addSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return;

  const variant = db
    .prepare(
      "SELECT id FROM variants WHERE id = ? AND active = 1 AND is_hidden = 0"
    )
    .get(parsed.data.variantId) as { id: number } | undefined;
  if (!variant) return;

  const cart = await getCart();
  const key = String(parsed.data.variantId);
  cart[key] = Math.min((cart[key] ?? 0) + parsed.data.quantity, 999);
  await saveCart(cart);
  refresh();
}

export async function updateCartItemAction(formData: FormData): Promise<void> {
  const parsed = addSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;

  const cart = await getCart();
  const key = String(parsed.data.variantId);
  if (parsed.data.quantity <= 0) {
    delete cart[key];
  } else {
    cart[key] = parsed.data.quantity;
  }
  await saveCart(cart);
  refresh();
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const variantId = Number(formData.get("variantId"));
  if (!Number.isInteger(variantId) || variantId <= 0) return;
  const cart = await getCart();
  delete cart[String(variantId)];
  await saveCart(cart);
  refresh();
}
