"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFavoriteIds, setFavorite } from "@/lib/favorites";

export type FavoritesState = { authenticated: boolean; ids: number[] };

export type SetFavoriteResult = {
  requiresAuth?: boolean;
  favorite?: boolean;
  error?: string;
};

export async function getFavoritesStateAction(): Promise<FavoritesState> {
  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ids: [] };
  return { authenticated: true, ids: getFavoriteIds(user.id) };
}

const setSchema = z.object({
  productId: z.number().int().positive(),
  favorite: z.boolean(),
});

export async function setFavoriteAction(
  productId: number,
  favorite: boolean
): Promise<SetFavoriteResult> {
  const parsed = setSchema.safeParse({ productId, favorite });
  if (!parsed.success) return { error: "Geçersiz istek" };

  const user = await getCurrentUser();
  if (!user) return { requiresAuth: true };

  const product = db
    .prepare(
      "SELECT id FROM products WHERE id = ? AND active = 1 AND is_hidden = 0"
    )
    .get(parsed.data.productId);
  if (!product) return { error: "Ürün bulunamadı" };

  setFavorite(user.id, parsed.data.productId, parsed.data.favorite);
  refresh();

  return { favorite: parsed.data.favorite };
}
