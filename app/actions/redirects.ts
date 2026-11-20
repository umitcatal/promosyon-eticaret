"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminActionState } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePath } from "@/lib/redirect-pattern";
import { validateRedirectInput } from "@/lib/redirects";
import { getAdminSiteId } from "@/lib/site-request";

export async function saveRedirectAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const id = Number(formData.get("id") ?? 0);
  if (!Number.isInteger(id) || id < 0) return { error: "Geçersiz kayıt." };

  const source = normalizePath(String(formData.get("source") ?? ""));
  const destination = String(formData.get("destination") ?? "").trim();
  const statusCode = Number(formData.get("statusCode") ?? 301);
  const note = String(formData.get("note") ?? "").trim();
  const active = formData.get("active") === "on" ? 1 : 0;

  const error = validateRedirectInput(
    siteId,
    {
      source,
      destination,
      statusCode,
      note: note === "" ? null : note,
      active: active === 1,
    },
    id
  );
  if (error) return { error };

  if (id > 0) {
    const existing = db
      .prepare("SELECT id FROM redirects WHERE site_id = ? AND id = ?")
      .get(siteId, id) as { id: number } | undefined;
    if (!existing) return { error: "Yönlendirme kaydı bulunamadı." };

    db.prepare(
      `UPDATE redirects
       SET source = ?, destination = ?, status_code = ?, note = ?, active = ?,
           updated_at = datetime('now')
       WHERE id = ? AND site_id = ?`
    ).run(
      source,
      destination,
      statusCode,
      note === "" ? null : note,
      active,
      id,
      siteId
    );

    redirect("/admin/yonlendirmeler?durum=guncellendi");
  }

  db.prepare(
    `INSERT INTO redirects (site_id, source, destination, status_code, note, active)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    siteId,
    source,
    destination,
    statusCode,
    note === "" ? null : note,
    active
  );

  redirect("/admin/yonlendirmeler?durum=eklendi");
}

export async function toggleRedirectActiveAction(
  id: number,
  active: boolean
): Promise<void> {
  await requireAdmin();
  const siteId = await getAdminSiteId();
  if (!Number.isInteger(id) || id <= 0) return;

  db.prepare(
    "UPDATE redirects SET active = ?, updated_at = datetime('now') WHERE id = ? AND site_id = ?"
  ).run(active ? 1 : 0, id, siteId);
  refresh();
}

export async function deleteRedirectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const siteId = await getAdminSiteId();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  db.prepare("DELETE FROM redirects WHERE id = ? AND site_id = ?").run(
    id,
    siteId
  );
  redirect("/admin/yonlendirmeler?durum=silindi");
}
