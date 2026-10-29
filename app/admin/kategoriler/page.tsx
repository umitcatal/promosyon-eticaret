import { AdminCategoryList } from "@/components/admin/category-list";
import { type CategoryAdminRow } from "@/components/admin/category-form";
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

  return <AdminCategoryList rows={rows} />;
}
