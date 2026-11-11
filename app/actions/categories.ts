"use server";

import { updateTag } from "next/cache";
import type { AdminActionState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import {
  deleteCategoryImage,
  saveCategoryImage,
  saveCategoryImageFromUrl,
} from "@/lib/uploads";

export type CategoryActionState = AdminActionState & {
  created?: {
    id: number;
    name: string;
    slug: string;
  };
};

function uniqueCategorySlug(base: string, parentId: number | null): string {
  const find = db.prepare(
    "SELECT 1 AS found FROM categories WHERE parent_id IS ? AND slug = ?"
  );
  const root = base || "kategori";
  let candidate = root;
  let suffix = 2;
  while (find.get(parentId, candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Kategori adı zorunludur." };

  const parentRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentRaw === "" ? null : Number(parentRaw);
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return { error: "Geçersiz üst kategori." };
  }
  if (
    parentId !== null &&
    !db.prepare("SELECT 1 AS found FROM categories WHERE id = ?").get(parentId)
  ) {
    return { error: "Üst kategori bulunamadı." };
  }

  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const active = formData.get("active") === "on" ? 1 : 0;
  const showOnHome = formData.get("showOnHome") === "on" ? 1 : 0;
  const metaTitle = String(formData.get("metaTitle") ?? "").trim() || null;
  const metaDescription =
    String(formData.get("metaDescription") ?? "").trim() || null;

  const file = formData.get("image");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  let newImage: string | null = null;

  try {
    if (file instanceof File && file.size > 0) {
      newImage = await saveCategoryImage(file);
    } else if (imageUrl) {
      newImage = await saveCategoryImageFromUrl(imageUrl);
    }

    let categoryId = 0;
    let slug = "";
    db.transaction(() => {
      slug = uniqueCategorySlug(slugify(name), parentId);
      const result = db
        .prepare(
          `INSERT INTO categories
             (parent_id, name, slug, image_url, sort_order, active,
              show_on_home, meta_title, meta_description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          parentId,
          name,
          slug,
          newImage,
          sortOrder,
          active,
          showOnHome,
          metaTitle,
          metaDescription
        );
      categoryId = Number(result.lastInsertRowid);
    }).immediate();

    updateTag("catalog");

    return {
      ok: true,
      message: `"${name}" kategorisi eklendi.`,
      nonce: crypto.randomUUID(),
      created: { id: categoryId, name, slug },
    };
  } catch (error) {
    if (newImage) await deleteCategoryImage(newImage);
    return { error: (error as Error).message };
  }
}