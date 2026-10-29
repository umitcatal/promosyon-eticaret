import { cookies } from "next/headers";

export type CartItems = Record<string, number>;

export const CART_COOKIE_NAME = "promosyon_cart";

export function parseCart(value: string | undefined): CartItems {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const result: CartItems = {};
    for (const [key, rawQuantity] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      const id = Number(key);
      const quantity = Number(rawQuantity);
      if (
        Number.isInteger(id) &&
        id > 0 &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 999
      ) {
        result[String(id)] = quantity;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function cartCount(items: CartItems): number {
  return Object.values(items).reduce((total, quantity) => total + quantity, 0);
}

export async function getCart(): Promise<CartItems> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE_NAME)?.value);
}

export async function saveCart(items: CartItems): Promise<void> {
  const store = await cookies();
  const entries = Object.entries(items).filter(([, quantity]) => quantity > 0);
  if (entries.length === 0) {
    store.delete(CART_COOKIE_NAME);
    return;
  }
  store.set(CART_COOKIE_NAME, JSON.stringify(Object.fromEntries(entries)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
