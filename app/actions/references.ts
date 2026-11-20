"use server";

import { updateTag } from "next/cache";
import type { AdminActionState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { siteTag } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { getAdminSiteId } from "@/lib/site-request";
import { deleteReferenceImage, saveReferenceImage } from "@/lib/uploads";

const MAX_BATCH_FILES = 10;
const MAX_BATCH_BYTES = 6 * 1024 * 1024;

function textOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function revalidateReferences(siteId: number): void {
  updateTag("references");
  updateTag(siteTag(siteId, "references"));
}

export async function createClientReferencesAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const names = formData.getAll("names");

  if (files.length === 0) {
    return { error: "Lütfen en az bir görsel seçin." };
  }
  if (files.length > MAX_BATCH_FILES) {
    return { error: `Tek seferde en fazla ${MAX_BATCH_FILES} görsel yükleyin.` };
  }
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_BATCH_BYTES) {
    return { error: "Toplam görsel boyutu 6 MB'ı aşamaz." };
  }

  const savedUrls: string[] = [];
  try {
    for (const file of files) {
      savedUrls.push(await saveReferenceImage(file));
    }

    db.transaction(() => {
      const { next } = db
        .prepare(
          "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM client_references WHERE site_id = ?"
        )
        .get(siteId) as { next: number };
      const insert = db.prepare(
        `INSERT INTO client_references
           (site_id, image_url, name, sort_order, active)
         VALUES (?, ?, ?, ?, 1)`
      );
      savedUrls.forEach((url, index) => {
        insert.run(
          siteId,
          url,
          textOrNull(names[index] ?? null),
          next + index
        );
      });
    })();
  } catch (error) {
    await Promise.all(savedUrls.map((url) => deleteReferenceImage(url)));
    return { error: (error as Error).message };
  }

  revalidateReferences(siteId);
  return {
    ok: true,
    message: `${savedUrls.length} referans eklendi.`,
    nonce: crypto.randomUUID(),
  };
}

export async function updateClientReferenceAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const referenceId = Number(formData.get("referenceId"));
  if (!Number.isInteger(referenceId) || referenceId <= 0) {
    return { error: "Geçersiz referans." };
  }

  const existing = db
    .prepare(
      "SELECT image_url, active FROM client_references WHERE site_id = ? AND id = ?"
    )
    .get(siteId, referenceId) as
    | { image_url: string; active: number }
    | undefined;
  if (!existing) {
    return { error: "Referans bulunamadı." };
  }

  const name = textOrNull(formData.get("name"));
  const active = formData.has("active")
    ? formData.get("active") === "on"
      ? 1
      : 0
    : existing.active;
  const file = formData.get("image");
  const hasNewImage = file instanceof File && file.size > 0;

  let imageUrl = existing.image_url;
  let uploadedUrl: string | null = null;
  try {
    if (hasNewImage) {
      uploadedUrl = await saveReferenceImage(file);
      imageUrl = uploadedUrl;
    }

    db.prepare(
      `UPDATE client_references
       SET image_url = ?, name = ?, active = ?, updated_at = datetime('now')
       WHERE id = ? AND site_id = ?`
    ).run(imageUrl, name, active, referenceId, siteId);

    if (uploadedUrl && existing.image_url !== uploadedUrl) {
      await deleteReferenceImage(existing.image_url);
    }
  } catch (error) {
    if (uploadedUrl) {
      await deleteReferenceImage(uploadedUrl);
    }
    return { error: (error as Error).message };
  }

  revalidateReferences(siteId);
  return {
    ok: true,
    message: "Referans güncellendi.",
    nonce: crypto.randomUUID(),
  };
}

export async function toggleClientReferenceActiveAction(
  referenceId: number,
  active: boolean
): Promise<void> {
  await requireAdmin();
  const siteId = await getAdminSiteId();
  if (!Number.isInteger(referenceId) || referenceId <= 0) return;

  db.prepare(
    `UPDATE client_references SET active = ?, updated_at = datetime('now')
     WHERE id = ? AND site_id = ?`
  ).run(active ? 1 : 0, referenceId, siteId);
  revalidateReferences(siteId);
}

export async function reorderClientReferencesAction(
  referenceIds: number[]
): Promise<void> {
  await requireAdmin();
  const siteId = await getAdminSiteId();
  if (
    !Array.isArray(referenceIds) ||
    referenceIds.length === 0 ||
    referenceIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(referenceIds).size !== referenceIds.length
  ) {
    return;
  }

  const placeholders = referenceIds.map(() => "?").join(", ");
  const { total } = db
    .prepare(
      `SELECT COUNT(*) AS total FROM client_references
       WHERE site_id = ? AND id IN (${placeholders})`
    )
    .get(siteId, ...referenceIds) as { total: number };
  if (total !== referenceIds.length) return;

  const update = db.prepare(
    `UPDATE client_references SET sort_order = ?, updated_at = datetime('now')
     WHERE id = ? AND site_id = ?`
  );
  db.transaction(() => {
    referenceIds.forEach((id, index) => update.run(index, id, siteId));
  })();
  revalidateReferences(siteId);
}

export async function deleteClientReferenceAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const siteId = await getAdminSiteId();
  const referenceId = Number(formData.get("referenceId"));
  if (!Number.isInteger(referenceId) || referenceId <= 0) return;

  const row = db
    .prepare(
      "SELECT image_url FROM client_references WHERE site_id = ? AND id = ?"
    )
    .get(siteId, referenceId) as { image_url: string } | undefined;
  if (!row) return;

  db.prepare(
    "DELETE FROM client_references WHERE site_id = ? AND id = ?"
  ).run(siteId, referenceId);
  await deleteReferenceImage(row.image_url);

  revalidateReferences(siteId);
}

export async function addReferencesMenuLinkAction(): Promise<AdminActionState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const existing = db
    .prepare(
      "SELECT id FROM menu_items WHERE site_id = ? AND href IN ('/referanslar', '/referanslar/') LIMIT 1"
    )
    .get(siteId) as { id: number } | undefined;

  if (!existing) {
    const { count } = db
      .prepare("SELECT COUNT(*) AS count FROM menu_items WHERE site_id = ?")
      .get(siteId) as { count: number };

    db.transaction(() => {
      let next = (
        db
          .prepare(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM menu_items WHERE site_id = ?"
          )
          .get(siteId) as { next: number }
      ).next;
      const insert = db.prepare(
        `INSERT INTO menu_items
           (site_id, label, type, href, page_id, open_in_new_tab, sort_order, active)
         VALUES (?, ?, ?, ?, NULL, 0, ?, 1)`
      );

      if (count === 0) {
        insert.run(siteId, "Ürünler", "categories", "/urunler", next);
        next += 1;
      }
      insert.run(siteId, "Referanslarımız", "link", "/referanslar", next);
    })();
  }

  db.prepare(
    `INSERT INTO site_settings (site_id, key, value) VALUES (?, 'references_menu_seeded', '1')
     ON CONFLICT(site_id, key) DO UPDATE SET value = excluded.value`
  ).run(siteId);

  updateTag("menu");
  updateTag(siteTag(siteId, "menu"));
  return {
    ok: true,
    message: existing
      ? "Menüde Referanslarımız bağlantısı zaten var."
      : "Menüye Referanslarımız bağlantısı eklendi.",
    nonce: crypto.randomUUID(),
  };
}
