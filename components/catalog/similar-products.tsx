import Link from "next/link";
import { CarouselShell } from "@/components/catalog/carousel-shell";
import { ProductCard } from "@/components/catalog/product-card";
import {
  COLLECTION_DESKTOP_WIDTH,
  COLLECTION_IMAGE_SIZES,
  COLLECTION_MOBILE_SLIDER_WIDTH,
} from "@/lib/home-widgets";
import { getSimilarProducts } from "@/lib/queries";
import type { Category } from "@/lib/types";

const LABEL = "Benzer ürünler";

export async function SimilarProducts({
  category,
  productId,
}: {
  category: Category | null;
  productId: number;
}) {
  if (!category) return null;

  const products = await getSimilarProducts(productId, category.id);
  if (products.length < 2) return null;

  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <p className="eyebrow">{LABEL}</p>
          <h2 className="mt-3 font-display text-2xl leading-none font-semibold tracking-tight text-ink sm:text-3xl">
            {category.name}
          </h2>
        </div>
        {category.active === 1 ? (
          <Link
            className="inline-flex items-center gap-2 border-b border-line pb-1 font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase transition-colors hover:border-ink hover:text-ink"
            href={`/kategori/${category.slug}`}
          >
            Kategoriyi gör
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        <CarouselShell
          arrowsOnMobile
          className="flex gap-4 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          label={LABEL}
          step="item"
        >
          {products.map((product) => (
            <li
              className={`shrink-0 snap-start ${COLLECTION_MOBILE_SLIDER_WIDTH[2]} ${COLLECTION_DESKTOP_WIDTH[4]}`}
              key={product.id}
            >
              <ProductCard product={product} sizes={COLLECTION_IMAGE_SIZES[4]} />
            </li>
          ))}
        </CarouselShell>
      </div>
    </section>
  );
}
