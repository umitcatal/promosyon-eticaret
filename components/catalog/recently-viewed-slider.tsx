"use client";

import { useEffect, useState } from "react";
import { CarouselShell } from "@/components/catalog/carousel-shell";
import { ProductCard } from "@/components/catalog/product-card";
import {
  WidgetHeading,
  WidgetLink,
} from "@/components/catalog/widget-heading";
import { Reveal } from "@/components/motion/reveal";
import {
  carouselClassNames,
  COLLECTION_IMAGE_SIZES,
} from "@/lib/home-widgets";
import {
  readRecentlyViewedIds,
  RECENTLY_VIEWED_MAX_ITEMS,
} from "@/lib/recently-viewed";
import type { CarouselStyleConfig, ProductListItem } from "@/lib/types";

const LABEL = "Son Gezilen Ürünler";

export type RecentlyViewedSliderProps = {
  config: CarouselStyleConfig;
  eyebrow: string | null;
  itemLimit: number;
  link: string | null;
  linkLabel: string | null;
  subtitle: string | null;
  title: string | null;
};

export function RecentlyViewedSlider({
  config,
  eyebrow,
  itemLimit,
  link,
  linkLabel,
  subtitle,
  title,
}: RecentlyViewedSliderProps) {
  const [products, setProducts] = useState<ProductListItem[] | null>(null);
  const limit =
    Math.min(24, Math.max(1, Math.trunc(itemLimit))) ||
    RECENTLY_VIEWED_MAX_ITEMS;

  useEffect(() => {
    const ids = readRecentlyViewedIds().slice(0, limit);
    if (ids.length === 0) return;

    let cancelled = false;
    fetch(`/api/recently-viewed?ids=${ids.join(",")}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (payload: { products?: ProductListItem[] } | null | undefined) => {
          if (cancelled) return;
          setProducts(
            Array.isArray(payload?.products)
              ? payload.products.slice(0, limit)
              : []
          );
        }
      )
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (!products || products.length === 0) return null;

  const headingTitle = title ?? LABEL;
  const sizes = COLLECTION_IMAGE_SIZES[config.perViewDesktop];
  const { item: itemClassName, list: listClassName } =
    carouselClassNames(config);

  return (
    <Reveal className="mx-auto w-full max-w-7xl px-4">
      <section className="mt-20 sm:mt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <WidgetHeading
            widget={{ eyebrow, subtitle, title: headingTitle }}
          />
          <WidgetLink label={linkLabel} link={link} />
        </div>
        <div className="mt-8">
          <CarouselShell
            arrowsOnMobile={config.mobileLayout === "slider"}
            autoplay={config.autoplay}
            autoplayInterval={config.autoplayInterval}
            className={listClassName}
            label={headingTitle}
            step={config.slideStep}
          >
            {products.map((product) => (
              <li className={itemClassName} key={product.id}>
                <ProductCard product={product} sizes={sizes} />
              </li>
            ))}
          </CarouselShell>
        </div>
      </section>
    </Reveal>
  );
}
