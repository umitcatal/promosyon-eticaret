import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-card";
import { requireUser } from "@/lib/auth";
import { getFavoriteProducts } from "@/lib/favorites";

export const instant = false;

export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: true },
};

export default async function FavoritesPage() {
  const user = await requireUser("/hesabim/favoriler");
  const products = getFavoriteProducts(user.id);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link className="transition hover:text-orange-600" href="/hesabim">
          Hesabım
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-800">Favorilerim</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Favorilerim
        </h1>
        <p className="text-sm text-zinc-500">{products.length} ürün</p>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-zinc-500">
            Henüz favori ürününüz bulunmuyor.
          </p>
          <Link
            className="mt-4 inline-flex rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            href="/urunler"
          >
            Ürünlere Göz At
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ProductGrid products={products} />
        </div>
      )}
    </div>
  );
}
