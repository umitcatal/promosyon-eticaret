import { updateOrderStatusAction } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ORDER_STATUSES,
  statusColor,
  statusLabel,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/orders";

export const metadata = {
  title: "Siparişler",
};

type OrderWithUser = OrderRow & {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

export default async function AdminOrdersPage() {
  const orders = db
    .prepare(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.phone
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC
       LIMIT 200`
    )
    .all() as OrderWithUser[];

  const itemsByOrder = new Map<number, OrderItemRow[]>();
  if (orders.length > 0) {
    const items = db
      .prepare(
        `SELECT * FROM order_items WHERE order_id IN (${orders
          .map(() => "?")
          .join(", ")}) ORDER BY id`
      )
      .all(...orders.map((order) => order.id)) as OrderItemRow[];
    for (const item of items) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrder.set(item.order_id, list);
    }
  }

  const newCount = orders.filter((order) => order.status === "yeni").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Siparişler</h2>
        <p className="text-sm text-zinc-500">
          {orders.length} sipariş
          {newCount > 0 ? ` • ${newCount} yeni` : ""}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-sm text-zinc-500">
          Henüz sipariş bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const items = itemsByOrder.get(order.id) ?? [];
            return (
              <details
                className="group rounded-2xl border border-zinc-200 bg-white"
                key={order.id}
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      Sipariş #{order.id}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {order.first_name} {order.last_name} • {order.email}
                      {order.phone ? ` • ${order.phone}` : ""}
                    </p>
                    <p className="text-xs text-zinc-400">
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
                      {order.total !== null
                        ? formatPrice(order.total)
                        : "Teklif"}
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
                      <span className="font-semibold">Müşteri notu:</span>{" "}
                      {order.note}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
                    <form
                      action={updateOrderStatusAction}
                      className="flex items-center gap-2"
                    >
                      <input name="orderId" type="hidden" value={order.id} />
                      <select
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                        defaultValue={order.status}
                        name="status"
                      >
                        {ORDER_STATUSES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                        type="submit"
                      >
                        Durumu Güncelle
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
