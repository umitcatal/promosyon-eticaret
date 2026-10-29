import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  statusColor,
  statusLabel,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/orders";

export const instant = false;

export const metadata = {
  title: "Siparişlerim",
};

export default async function OrdersPage({
  searchParams,
}: PageProps<"/hesabim/siparisler">) {
  const user = await requireUser("/hesabim/siparisler");
  const params = await searchParams;
  const createdId =
    typeof params.olustu === "string" ? Number(params.olustu) : null;

  const orders = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC")
    .all(user.id) as OrderRow[];

  const itemsByOrder = new Map<number, OrderItemRow[]>();
  if (orders.length > 0) {
    const placeholders = orders.map(() => "?").join(", ");
    const items = db
      .prepare(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`
      )
      .all(...orders.map((order) => order.id)) as OrderItemRow[];
    for (const item of items) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link className="transition hover:text-orange-600" href="/hesabim">
          Hesabım
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-800">Siparişlerim</span>
      </nav>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
        Siparişlerim
      </h1>

      {createdId ? (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Siparişiniz alındı (#{createdId}). Ekibimiz en kısa sürede sizinle
          iletişime geçecek.
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-zinc-500">
            Henüz siparişiniz bulunmuyor.
          </p>
          <Link
            className="mt-4 inline-flex rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            href="/"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const items = itemsByOrder.get(order.id) ?? [];
            return (
              <details
                className="group rounded-2xl border border-zinc-200 bg-white"
                key={order.id}
                open={order.id === createdId}
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      Sipariş #{order.id}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatDateTime(order.created_at)} • {items.length} kalem
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <span className="text-sm font-bold text-zinc-900">
                      {order.total !== null ? formatPrice(order.total) : "Teklif"}
                    </span>
                    <svg
                      className="h-4 w-4 text-zinc-400 transition group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" />
                    </svg>
                  </div>
                </summary>

                <div className="border-t border-zinc-100 px-5 py-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-zinc-400">
                        <th className="pb-2 font-semibold">Ürün</th>
                        <th className="pb-2 font-semibold">Kod</th>
                        <th className="pb-2 text-center font-semibold">Adet</th>
                        <th className="pb-2 text-right font-semibold">Birim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 pr-3">
                            <p className="font-medium text-zinc-800">
                              {item.product_name}
                            </p>
                            {item.variant_name ? (
                              <p className="text-xs text-zinc-500">
                                {item.variant_name}
                              </p>
                            ) : null}
                          </td>
                          <td className="py-2.5 pr-3 text-zinc-500">
                            {item.product_code}
                          </td>
                          <td className="py-2.5 text-center text-zinc-700">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 text-right text-zinc-700">
                            {item.unit_price !== null
                              ? formatPrice(item.unit_price)
                              : "Teklif"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {order.note ? (
                    <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">
                      <span className="font-semibold">Notunuz:</span>{" "}
                      {order.note}
                    </p>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
