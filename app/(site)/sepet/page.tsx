import Link from "next/link";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart";
import { createOrderAction } from "@/app/actions/orders";
import { ProductImage } from "@/components/catalog/product-image";
import { firstImage, formatPrice } from "@/lib/format";
import { getCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getVatRate } from "@/lib/queries";
import { breakdownVat } from "@/lib/vat";

export const instant = false;

export const metadata = {
  title: "Sepetim",
};

type CartRow = {
  id: number;
  attr_name: string | null;
  images: string;
  price: number | null;
  product_name: string;
  product_slug: string;
  code: string;
};

export default async function CartPage() {
  const cart = await getCart();
  const variantIds = Object.keys(cart)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);

  const rows: CartRow[] =
    variantIds.length > 0
      ? (db
          .prepare(
            `SELECT v.id, v.attr_name, v.images, v.price,
                    p.name AS product_name, p.slug AS product_slug, p.code
             FROM variants v
             JOIN products p ON p.id = v.product_id
             WHERE v.id IN (${variantIds.map(() => "?").join(", ")})
               AND v.active = 1 AND v.is_hidden = 0
               AND p.active = 1 AND p.is_hidden = 0
             ORDER BY v.id`
          )
          .all(...variantIds) as CartRow[])
      : [];

  const user = await getCurrentUser();
  const vatRate = getVatRate();
  const totals = rows.every((row) => row.price !== null)
    ? breakdownVat(
        rows.reduce(
          (sum, row) => sum + (row.price ?? 0) * (cart[String(row.id)] ?? 1),
          0
        ),
        vatRate
      )
    : null;
  const itemCount = rows.reduce(
    (sum, row) => sum + (cart[String(row.id)] ?? 1),
    0
  );

  if (rows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-bold text-zinc-900">Sepetiniz boş</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Kategorilere göz atıp beğendiğiniz ürünleri sepetinize ekleyin.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            href="/"
          >
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Sepetim
      </h1>
      <p className="mt-1 text-sm text-zinc-500">{itemCount} ürün</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {rows.map((row) => {
            const image = firstImage(row.images);
            const quantity = cart[String(row.id)] ?? 1;
            const price = formatPrice(row.price);
            const lineTotal = formatPrice(
              row.price !== null ? row.price * quantity : null
            );

            return (
              <div
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
                key={row.id}
              >
                <Link
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-white"
                  href={`/urun/${row.product_slug}`}
                >
                  <ProductImage
                    alt={row.product_name}
                    className="object-contain p-2"
                    fallbackLabel={row.product_name}
                    sizes="96px"
                    src={image}
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        className="line-clamp-2 text-sm font-semibold text-zinc-900 transition hover:text-orange-700"
                        href={`/urun/${row.product_slug}`}
                      >
                        {row.product_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {row.attr_name ? `${row.attr_name} • ` : ""}
                        Kod: {row.code}
                      </p>
                    </div>
                    <form action={removeCartItemAction}>
                      <input name="variantId" type="hidden" value={row.id} />
                      <button
                        className="text-xs font-medium text-red-600 transition hover:text-red-700"
                        type="submit"
                      >
                        Kaldır
                      </button>
                    </form>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-center rounded-lg border border-zinc-300">
                      <form action={updateCartItemAction}>
                        <input name="variantId" type="hidden" value={row.id} />
                        <input
                          name="quantity"
                          type="hidden"
                          value={quantity - 1}
                        />
                        <button
                          aria-label="Adet azalt"
                          className="flex h-9 w-9 items-center justify-center text-zinc-600 transition hover:text-orange-600"
                          type="submit"
                        >
                          −
                        </button>
                      </form>
                      <span className="w-9 text-center text-sm font-semibold">
                        {quantity}
                      </span>
                      <form action={updateCartItemAction}>
                        <input name="variantId" type="hidden" value={row.id} />
                        <input
                          name="quantity"
                          type="hidden"
                          value={quantity + 1}
                        />
                        <button
                          aria-label="Adet artır"
                          className="flex h-9 w-9 items-center justify-center text-zinc-600 transition hover:text-orange-600"
                          type="submit"
                        >
                          +
                        </button>
                      </form>
                    </div>

                    <div className="text-right">
                      {price ? (
                        <>
                          <p className="text-sm font-bold text-zinc-900">
                            {lineTotal}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Birim: {price}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-orange-700">
                          Teklif ile fiyatlandırılacak
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-bold text-zinc-900">Sipariş Özeti</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <dt>Ürün adedi</dt>
              <dd className="font-medium text-zinc-900">{itemCount}</dd>
            </div>
            <div className="flex justify-between text-zinc-600">
              <dt>Ara Toplam:</dt>
              <dd className="font-medium text-zinc-900">
                {totals !== null
                  ? formatPrice(totals.net)
                  : "Teklif ile belirlenecek"}
              </dd>
            </div>
            {totals ? (
              <>
                <div className="flex justify-between text-zinc-600">
                  <dt>KDV (%{vatRate}):</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatPrice(totals.vat)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-zinc-900">
                  <dt className="font-bold">KDV Dahil Toplam:</dt>
                  <dd className="font-bold">{formatPrice(totals.gross)}</dd>
                </div>
              </>
            ) : null}
          </dl>

          <form action={createOrderAction} className="mt-5 space-y-3">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-zinc-700"
                htmlFor="note"
              >
                Sipariş notu (opsiyonel)
              </label>
              <textarea
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500"
                id="note"
                name="note"
                placeholder="Logo baskı, teslimat veya fatura notlarınız..."
                rows={3}
              />
            </div>
            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              type="submit"
            >
              {user ? "Siparişi Tamamla" : "Giriş Yap ve Siparişi Tamamla"}
            </button>
            {!user ? (
              <p className="text-xs leading-5 text-zinc-500">
                Siparişi tamamlamak için{" "}
                <Link
                  className="font-semibold text-orange-600"
                  href="/giris?next=%2Fsepet"
                >
                  giriş yapın
                </Link>{" "}
                veya{" "}
                <Link
                  className="font-semibold text-orange-600"
                  href="/kayit?next=%2Fsepet"
                >
                  üye olun
                </Link>
                .
              </p>
            ) : null}
          </form>

          <p className="mt-4 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500">
            Siparişiniz kurumsal teklif olarak alınır; ödeme ve teslimat
            detayları için ekibimiz sizinle iletişime geçer.
          </p>
        </aside>
      </div>
    </div>
  );
}
