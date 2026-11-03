import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/lib/types";

function PriceLabel({ product }: { product: ProductListItem }) {
  const min = formatPrice(product.min_price);
  const max = formatPrice(product.max_price);
  const priceLabel = min && max && min !== max ? `${min} – ${max}` : min;

  if (priceLabel) {
    return (
      <p className="font-display text-[15px] font-semibold tabular-nums text-ink">
        {priceLabel}
      </p>
    );
  }

  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-700 underline decoration-brass-300 decoration-1 underline-offset-4">
      Teklif İste
    </p>
  );
}

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      className="group flex flex-col overflow-hidden rounded-sm border border-line bg-paper transition-colors duration-300 hover:border-ink/35"
      href={`/urun/${product.slug}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface/50">
        <ProductImage
          alt={product.name}
          className="object-contain p-5 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          src={product.image}
        />
        {product.is_featured ? (
          <span className="absolute left-0 top-4 rounded-r-sm bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-200">
            Öne Çıkan
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          {product.code}
        </p>
        <h3 className="line-clamp-2 font-display text-[16px] leading-snug font-semibold text-ink decoration-line-strong decoration-1 underline-offset-4 transition group-hover:underline">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          <PriceLabel product={product} />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-line-strong bg-paper px-6 py-16 text-center">
        <p className="font-display text-lg text-ink-muted">
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

export function ProductLedger({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <ol className="border-t border-line">
      {products.map((product) => (
        <li key={product.id} className="border-b border-line">
          <Link
            className="group flex items-center gap-4 py-4"
            href={`/urun/${product.slug}`}
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-sm border border-line bg-surface/50 sm:size-14">
              <ProductImage
                alt={product.name}
                className="object-contain p-1.5 mix-blend-multiply"
                fallbackClassName="flex h-full w-full items-center justify-center bg-surface font-display text-base font-semibold text-brass-300"
                sizes="56px"
                src={product.image}
              />
            </span>
            <span className="hidden w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted sm:block">
              {product.code}
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-[15px] font-medium text-ink transition-colors group-hover:text-brand-700">
              {product.name}
            </span>
            <span className="shrink-0 text-right">
              <PriceLabel product={product} />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
