import Link from "next/link";
import { ArrowLeft, History, RotateCcw, Trash2 } from "lucide-react";
import { restoreProductAction } from "@/app/actions/products";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const instant = false;

export const metadata = {
  title: "Silinen Ürünler",
};

const STATUS_MESSAGES: Record<string, string> = {
  silindi:
    "Ürün silinenler alanına taşındı. Yanlışlıkla sildiyseniz aşağıdan geri alabilirsiniz.",
  "geri-alindi": "Ürün geri alındı ve katalogda yeniden yerini aldı.",
};

type DeletedProductRow = {
  id: number;
  code: string;
  name: string;
  source: string;
  deleted_at: string;
  category_name: string | null;
  variant_count: number;
};

type OperationRow = {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string | null;
  action: string;
  variant_count: number;
  created_at: string;
};

export default async function AdminDeletedProductsPage({
  searchParams,
}: PageProps<"/[site]/admin/urunler/cop">) {
  const params = await searchParams;
  const status =
    typeof params.durum === "string" ? STATUS_MESSAGES[params.durum] : undefined;
  const error =
    typeof params.hata === "string"
      ? "İşlem tamamlanamadı: ürün bulunamadı veya işlem daha önce yapılmış."
      : undefined;

  const deleted = db
    .prepare(
      `SELECT p.id, p.code, p.name, p.source, p.deleted_at,
              c.name AS category_name,
              (SELECT COUNT(*) FROM variants v WHERE v.product_id = p.id) AS variant_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.deleted_at IS NOT NULL
       ORDER BY p.deleted_at DESC, p.id DESC`
    )
    .all() as DeletedProductRow[];

  const operations = db
    .prepare(
      `SELECT id, product_id, product_name, product_code, action, variant_count, created_at
       FROM product_operations
       ORDER BY id DESC
       LIMIT 20`
    )
    .all() as OperationRow[];

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link className="transition hover:text-orange-600" href="/admin/urunler">
          Ürünler
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-800">Silinen Ürünler</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Silinen Ürünler</h2>
          <p className="text-sm text-zinc-500">
            {deleted.length} silinmiş ürün güvenle saklanıyor
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          href="/admin/urunler"
        >
          <ArrowLeft className="h-4 w-4" />
          Ürünlere Dön
        </Link>
      </div>

      {status ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {status}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Ürün</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 text-center font-semibold">Varyant</th>
              <th className="px-4 py-3 font-semibold">Silinme Tarihi</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {deleted.map((row) => (
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
                <td className="px-4 py-3 text-zinc-600">
                  {formatDateTime(row.deleted_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={restoreProductAction}>
                    <input name="productId" type="hidden" value={row.id} />
                    <button
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      type="submit"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Geri Al
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deleted.length === 0 ? (
          <div className="border-t border-zinc-100 px-6 py-12 text-center">
            <Trash2 className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-3 text-sm font-semibold text-zinc-700">
              Silinmiş ürün yok
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Bir ürünü sildiğinizde burada güvenle saklanır ve tek tıkla geri
              alabilirsiniz.
            </p>
          </div>
        ) : null}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4">
          <History className="h-5 w-5 text-zinc-400" />
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Geçmiş İşlemler</h3>
            <p className="text-xs text-zinc-500">
              Son 20 ürün silme ve geri alma kaydı
            </p>
          </div>
        </div>

        {operations.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">
            Henüz kayıtlı bir işlem yok.
          </p>
        ) : (
          <ol className="divide-y divide-zinc-100">
            {operations.map((operation) => {
              const isRestore = operation.action === "restore";
              return (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  key={operation.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isRestore
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isRestore ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-800">
                        <span className="font-semibold text-zinc-900">
                          {operation.product_name}
                        </span>{" "}
                        {isRestore ? "geri alındı" : "silindi"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {operation.product_code
                          ? `Kod: ${operation.product_code} · `
                          : ""}
                        {operation.variant_count} varyant
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isRestore
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isRestore ? "Geri Alındı" : "Silindi"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDateTime(operation.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
