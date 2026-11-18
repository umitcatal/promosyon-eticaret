import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { statusColor, statusLabel, type OrderRow } from "@/lib/orders";

export const instant = false;

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: true },
};

export default async function AccountPage() {
  const user = await requireUser("/hesabim");

  const orders = db
    .prepare(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 3"
    )
    .all(user.id) as OrderRow[];

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Hesabım
      </h1>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-bold text-zinc-900">Son Siparişler</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Henüz siparişiniz bulunmuyor.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {orders.map((order) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 py-3"
                key={order.id}
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Sipariş #{order.id}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {order.total !== null ? formatPrice(order.total) : "Teklif"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-orange-600 transition hover:text-orange-700"
          href="/hesabim/siparisler"
        >
          Tüm siparişleri görüntüle →
        </Link>
      </section>
    </>
  );
}
