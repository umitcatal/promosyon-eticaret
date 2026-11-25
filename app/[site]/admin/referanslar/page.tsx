import Link from "next/link";
import { ReferencesManager } from "@/components/admin/references-manager";
import { db } from "@/lib/db";
import { fetchClientReferences } from "@/lib/queries";
import { getAdminSiteId } from "@/lib/site-request";

export const instant = false;

export const metadata = {
  title: "Referanslar",
};

export default async function AdminReferencesPage() {
  const siteId = await getAdminSiteId();
  const references = fetchClientReferences(siteId);
  const menu = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN href IN ('/referanslar', '/referanslar/') THEN 1 ELSE 0 END) AS linked
       FROM menu_items
       WHERE site_id = ?`
    )
    .get(siteId) as { total: number; linked: number | null };
  const active = references.filter((reference) => reference.active === 1).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Referanslar</h2>
        <p className="text-sm text-zinc-500">
          {references.length} logo • {active} aktif • Aktif logolar ana sayfa
          şeridinde ve{" "}
          <Link className="font-medium text-orange-700 underline" href="/referanslar">
            referanslar sayfasında
          </Link>{" "}
          görünür
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Şeridin konumu, satır sayısı ve akış hızı{" "}
          <Link
            className="font-medium text-orange-700 underline"
            href="/admin/anasayfa"
          >
            Anasayfa widget alanlarından
          </Link>{" "}
          ayarlanır.
        </p>
      </div>

      <ReferencesManager
        hasMenuLink={(menu.linked ?? 0) > 0}
        menuEmpty={menu.total === 0}
        references={references}
      />
    </div>
  );
}
