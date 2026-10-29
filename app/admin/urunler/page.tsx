import Link from "next/link";
import { Pagination } from "@/components/catalog/pagination";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = {
  title: "Ürünler",
};

const PAGE_SIZE = 40;

type ProductAdminRow = {
  id: number;
  code: string;
  name: string;
  is_featured: number;
  is_hidden: number;
  active: number;
  category_name: string | null;
  variant_count: number;
  min_price: number | null;
  max_price: number | null;
};

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/urunler">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Number(params.sayfa ?? "1") || 1;
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;

  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const condition = q
    ? "(p.name LIKE ? ESCAPE '\\' OR p.code LIKE ? ESCAPE '\\')"
    : "1 = 1";
  const filterParams = q ? [pattern, pattern] : [];

  const total = (
    db
      .prepare(`SELECT COUNT(*) AS total FROM products p WHERE ${condition}`)
      .get(...filterParams) as { total: number }
  ).total;

  const rows = db
    .prepare(
      `SELECT p.id, p.code, p.name, p.is_featured, p.is_hidden, p.active,
        c.name AS category_name,
        (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count,
        (SELECT MIN(v.price) FROM variants v WHERE v.product_id = p.id AND v.price IS NOT NULL) AS min_price,
        (SELECT MAX(v.price) FROM variants v WHERE v.product_id = p.id AND v.price IS NOT NULL) AS max_price
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${condition}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...filterParams, PAGE_SIZE, offset) as ProductAdminRow[];

  const paginationQuery: Record<string, string> = q ? { q } : {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Ürünler</h2>
          <p className="text-sm text-zinc-500">{total} ürün</p>
        </div>
        <form className="flex gap-2" method="GET">
          <input
            className="w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-500"
            defaultValue={q}
            name="q"
            placeholder="Ürün adı veya kodu ara..."
            type="search"
          />
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
            type="submit"
          >
            Ara
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Ürün</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 text-center font-semibold">Varyant</th>
              <th className="px-4 py-3 font-semibold">Fiyat</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => {
              const min = formatPrice(row.min_price);
              const max = formatPrice(row.max_price);
              const priceLabel =
                min && max && min !== max ? `${min} – ${max}` : min;
              return (
                <tr className="hover:bg-zinc-50/60" key={row.id}>
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-medium text-zinc-800">
                      {row.name}
                    </p>
                    <p className="text-xs text-zinc-400">Kod: {row.code}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {row.category_name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600">
                    {row.variant_count}
                  </td>
                  <td className="px-4 py-3">
                    {priceLabel ?? (
                      <span className="text-xs font-semibold text-orange-600">
                        Teklif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.is_hidden ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                          Gizli
                        </span>
                      ) : null}
                      {row.is_featured ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                          Öne Çıkan
                        </span>
                      ) : null}
                      {!row.active ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Kaynakta Yok
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="font-semibold text-orange-600 transition hover:text-orange-700"
                      href={`/admin/urunler/${row.id}`}
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        basePath="/admin/urunler"
        page={Math.max(1, page)}
        pageSize={PAGE_SIZE}
        query={paginationQuery}
        total={total}
      />
    </div>
  );
}
