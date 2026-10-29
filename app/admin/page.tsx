import Link from "next/link";
import {
  SyncCatalogButton,
  SyncPricesButton,
} from "@/components/admin/sync-buttons";
import { db, getSetting } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Yönetim Paneli",
};

type Stats = {
  products: number;
  variants: number;
  categories: number;
  users: number;
  orders: number;
  newOrders: number;
};

type SyncResult = {
  products: number;
  variants: number;
  durationMs: number;
  priceUpdated?: number;
  source?: "api" | "file" | null;
  xmlPath?: string | null;
};

export default async function AdminDashboardPage() {
  const stats = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM products WHERE active = 1) AS products,
        (SELECT COUNT(*) FROM variants WHERE active = 1) AS variants,
        (SELECT COUNT(*) FROM categories) AS categories,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'yeni') AS newOrders`
    )
    .get() as Stats;

  const lastSyncAt = getSetting("last_sync_at");
  const lastSyncResultRaw = getSetting("last_sync_result");
  let lastSyncResult: SyncResult | null = null;
  if (lastSyncResultRaw) {
    try {
      lastSyncResult = JSON.parse(lastSyncResultRaw) as SyncResult;
    } catch {
      lastSyncResult = null;
    }
  }

  const cards = [
    { label: "Aktif Ürün", value: stats.products, href: "/admin/urunler" },
    { label: "Varyant", value: stats.variants, href: "/admin/urunler" },
    { label: "Kategori", value: stats.categories, href: "/admin/kategoriler" },
    { label: "Üye", value: stats.users, href: "/admin/uyeler" },
    {
      label: "Sipariş",
      value: stats.orders,
      href: "/admin/siparisler",
      hint: `${stats.newOrders} yeni`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-orange-200 hover:shadow-sm"
            href={card.href}
            key={card.label}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {card.value}
            </p>
            {card.hint ? (
              <p className="mt-1 text-xs font-medium text-orange-600">
                {card.hint}
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-bold text-zinc-900">
          Katalog Güncelleme
        </h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Ürün, kategori, görsel ve fiyatları kaynak XML&apos;den günceller.
          API&apos;ye ulaşılamazsa data/xml/urunler.xml dosyasını kullanır.
          Gizlilik ayarları korunur; XML&apos;de fiyat yoksa mevcut fiyatlar
          değişmez.
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <SyncCatalogButton />
          <SyncPricesButton />
        </div>
        <div className="mt-5 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
          {lastSyncAt ? (
            <p>
              <span className="font-semibold text-zinc-800">Son güncelleme:</span>{" "}
              {formatDateTime(lastSyncAt)}
              {lastSyncResult
                ? ` • ${lastSyncResult.products} ürün, ${lastSyncResult.variants} varyant (${(lastSyncResult.durationMs / 1000).toFixed(1)} sn)`
                : ""}
              {lastSyncResult?.source === "api"
                ? " • kaynak: API"
                : lastSyncResult?.source === "file"
                  ? ` • kaynak: dosya (${lastSyncResult.xmlPath ?? "data/xml/urunler.xml"})`
                  : ""}
            </p>
          ) : (
            <p>Henüz katalog güncellemesi yapılmadı.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-bold text-zinc-900">Fiyatlar</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Fiyatlar katalog XML&apos;indeki fiyat alanından çekilir ve varyantlara
          yazılır (admin girişi farketmez, XML her zaman günceldir). Ayrı bir
          fiyat beslemesi için Ayarlar bölümünden{" "}
          <span className="font-medium text-zinc-700">PRICE_XML_URL</span>{" "}
          tanımlayabilirsiniz. Fiyatı olmayan ürünlerde sitede &quot;Teklif
          İste&quot; gösterilir.
        </p>
        <Link
          className="mt-3 inline-flex text-sm font-semibold text-orange-600 transition hover:text-orange-700"
          href="/admin/ayarlar"
        >
          Fiyat kaynağı ayarları →
        </Link>
      </div>
    </div>
  );
}
