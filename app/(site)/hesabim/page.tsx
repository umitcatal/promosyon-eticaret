import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/format";
import { statusColor, statusLabel, type OrderRow } from "@/lib/orders";

export const instant = false;

export const metadata = {
  title: "Hesabım",
};

export default async function AccountPage() {
  const user = await requireUser("/hesabim");

  const orders = db
    .prepare(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 3"
    )
    .all(user.id) as OrderRow[];

  const orderCount = (
    db
      .prepare("SELECT COUNT(*) AS total FROM orders WHERE user_id = ?")
      .get(user.id) as { total: number }
  ).total;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Hesabım
      </h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700">
              {user.firstName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <nav className="mt-5 space-y-1 border-t border-zinc-100 pt-4 text-sm">
            <Link
              className="block rounded-lg bg-orange-50 px-3 py-2 font-semibold text-orange-700"
              href="/hesabim"
            >
              Genel Bakış
            </Link>
            <Link
              className="block rounded-lg px-3 py-2 text-zinc-700 transition hover:bg-zinc-50"
              href="/hesabim/siparisler"
            >
              Siparişlerim ({orderCount})
            </Link>
            {user.role === "admin" ? (
              <Link
                className="block rounded-lg px-3 py-2 font-semibold text-orange-700 transition hover:bg-zinc-50"
                href="/admin"
              >
                Yönetim Paneli
              </Link>
            ) : null}
          </nav>
        </aside>

        <section>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
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
                        {order.total !== null
                          ? formatPrice(order.total)
                          : "Teklif"}
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
          </div>
        </section>
      </div>
    </div>
  );
}
