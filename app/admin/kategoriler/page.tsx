import {
  CategoryForm,
  type CategoryAdminRow,
} from "@/components/admin/category-form";
import { db } from "@/lib/db";

export const metadata = {
  title: "Kategoriler",
};

export default async function AdminCategoriesPage() {
  const rows = db
    .prepare(
      `SELECT c.*, p.name AS parent_name,
        (SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id AND pr.active = 1) AS product_count
       FROM categories c
       LEFT JOIN categories p ON p.id = c.parent_id
       ORDER BY COALESCE(p.name, c.name), c.name`
    )
    .all() as CategoryAdminRow[];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Kategoriler</h2>
        <p className="text-sm text-zinc-500">
          {rows.length} kategori • Ana sayfada gösterilecek kategori görselini
          buradan yükleyin
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <CategoryForm category={row} key={row.id} />
        ))}
      </div>
    </div>
  );
}
