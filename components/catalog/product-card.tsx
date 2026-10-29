import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const min = formatPrice(product.min_price);
  const max = formatPrice(product.max_price);
  const priceLabel = min && max && min !== max ? `${min} – ${max}` : min;

  return (
    <Link
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
      href={`/urun/${product.slug}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        <ProductImage
          alt={product.name}
          className="object-contain p-4 transition duration-300 group-hover:scale-105"
          fallbackLabel={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          src={product.image}
        />
        {product.is_featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            Öne Çıkan
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col border-t border-zinc-100 p-4">
        <p className="text-xs font-medium text-zinc-400">
          Kod: {product.code}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-zinc-900 transition group-hover:text-orange-700">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          {priceLabel ? (
            <p className="text-base font-bold text-zinc-900">{priceLabel}</p>
          ) : (
            <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              Teklif İste
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-zinc-500">
          Bu kategoride gösterilecek ürün bulunamadı.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
