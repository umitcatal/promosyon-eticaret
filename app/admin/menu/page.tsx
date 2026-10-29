import {
  MenuManager,
  type MenuManagerItem,
  type MenuPageOption,
} from "@/components/admin/menu-manager";
import { db } from "@/lib/db";

export const metadata = {
  title: "Menü",
};

export default function AdminMenuPage() {
  const items = db
    .prepare(
      `SELECT m.*, p.title AS page_title, p.slug AS page_slug
       FROM menu_items m
       LEFT JOIN pages p ON p.id = m.page_id
       ORDER BY m.sort_order, m.id`
    )
    .all() as MenuManagerItem[];

  const pages = db
    .prepare(
      "SELECT id, title, slug, active FROM pages ORDER BY title COLLATE NOCASE"
    )
    .all() as MenuPageOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Header Menüsü</h2>
        <p className="text-sm text-zinc-500">
          {items.length} öğe • Sitedeki üst menüyü ve mega menüyü buradan
          yönetin
        </p>
      </div>

      <MenuManager items={items} pages={pages} />
    </div>
  );
}
