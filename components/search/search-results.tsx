"use client";

import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { PriceLabel } from "@/components/catalog/price-label";
import { secondaryButtonClass } from "@/components/ui/styles";
import type { SearchProductItem } from "@/lib/types";
import { useSearch } from "./search-provider";

function SearchSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="aspect-[3/2] animate-pulse rounded-sm border border-line bg-surface/60"
          key={index}
        />
      ))}
    </div>
  );
}

function SearchHint() {
  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="font-display text-lg text-ink-muted">
        Ürün adı veya ürün koduyla aramaya başlayın.
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        En az 2 karakter
      </p>
    </div>
  );
}

function SearchEmpty() {
  return (
    <div className="mt-5 rounded-sm border border-dashed border-line-strong bg-paper px-6 py-12 text-center">
      <p className="font-display text-lg text-ink-muted">Sonuç bulunamadı.</p>
      <p className="mt-2 text-sm text-ink-muted">
        Ürün adı veya ürün kodunu kontrol edin.
      </p>
      <Link
        className="mt-4 inline-block border-b border-line-strong pb-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700"
        href="/urunler"
      >
        Tüm ürünleri incele →
      </Link>
    </div>
  );
}

function SearchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-5 rounded-sm border border-dashed border-line-strong bg-paper px-6 py-10 text-center">
      <p className="font-display text-lg text-ink-muted">
        Arama şu anda yapılamıyor.
      </p>
      <button
        className={`${secondaryButtonClass} mt-4`}
        onClick={onRetry}
        type="button"
      >
        Tekrar dene
      </button>
    </div>
  );
}

function CategorySection({ mobile }: { mobile: boolean }) {
  const { displayData, activeKey, setActiveKey, optionId, closeSearch } =
    useSearch();
  const categories = displayData?.categories ?? [];

  if (categories.length === 0) return null;

  return (
    <div aria-label="Kategoriler" role="group">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Kategoriler</p>
        <span className="font-mono text-[10px] tabular-nums text-ink-muted">
          {categories.length}
        </span>
      </div>
      <ul
        className={`mt-3 border-t border-line ${
          mobile
            ? ""
            : "search-scroll max-h-[42vh] overflow-y-auto overscroll-contain"
        }`}
      >
        {categories.map((category) => {
          const key = `cat:${category.id}`;
          const active = activeKey === key;

          return (
            <li className="border-b border-line" key={key}>
              <Link
                aria-selected={active}
                className={`flex items-center gap-3 px-2 py-2.5 transition-colors ${
                  active
                    ? "bg-surface/70 text-brand-700"
                    : "text-ink hover:bg-surface/50"
                }`}
                href={`/kategori/${category.slug}`}
                id={optionId(key)}
                onClick={() => closeSearch()}
                onFocus={() => setActiveKey(key)}
                role="option"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[14px] font-semibold">
                    {category.name}
                  </span>
                  {category.parent_name ? (
                    <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
                      {category.parent_name}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-brass-600"
                >
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchProductCard({ product }: { product: SearchProductItem }) {
  const { activeKey, setActiveKey, optionId, closeSearch } = useSearch();
  const key = `prd:${product.id}`;
  const active = activeKey === key;

  return (
    <Link
      aria-selected={active}
      className={`group flex flex-col overflow-hidden rounded-sm border bg-paper transition-colors ${
        active
          ? "border-brand-500 ring-1 ring-brand-500"
          : "border-line hover:border-ink/35"
      }`}
      href={`/urun/${product.slug}`}
      id={optionId(key)}
      onClick={() => closeSearch()}
      onFocus={() => setActiveKey(key)}
      role="option"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface/50">
        <ProductImage
          alt={product.name}
          className="object-contain p-3 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          fallbackClassName="flex h-full w-full items-center justify-center bg-surface font-display text-2xl font-semibold text-brass-300"
          sizes="(max-width: 1024px) 40vw, 16vw"
          src={product.image}
          unoptimized={product.image?.startsWith("http") ?? false}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line px-3 py-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted">
          {product.code}
        </p>
        <h3 className="line-clamp-2 font-display text-[13.5px] leading-snug font-semibold text-ink">
          {product.name}
        </h3>
        <div className="mt-auto pt-1.5">
          <PriceLabel max={product.max_price} min={product.min_price} />
        </div>
      </div>
    </Link>
  );
}

function ProductSection({ mobile }: { mobile: boolean }) {
  const { displayData } = useSearch();
  const products = displayData?.products ?? [];

  if (products.length === 0) return null;

  return (
    <div aria-label="Ürünler" role="group">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Ürünler</p>
        <span className="font-mono text-[10px] tabular-nums text-ink-muted">
          {displayData?.productTotal ?? 0} sonuç
        </span>
      </div>
      <div
        className={`mt-3 grid gap-3 ${
          mobile ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {products.map((product) => (
          <SearchProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ResultsFooter({ mobile }: { mobile: boolean }) {
  const {
    displayData,
    normalizedQuery,
    activeKey,
    setActiveKey,
    optionId,
    closeSearch,
  } = useSearch();

  if (!displayData || displayData.productTotal === 0) return null;

  const active = activeKey === "all";

  return (
    <div
      className={`mt-4 flex gap-3 border-t border-line pt-3 ${
        mobile
          ? "flex-col"
          : "flex-col sm:flex-row sm:items-center sm:justify-between"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        Ürün adı veya kodu · en az 2 karakter
      </p>
      <Link
        aria-selected={active}
        className={`inline-flex items-center justify-center gap-3 rounded-sm bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 ${
          active ? "ring-2 ring-brand-500/40" : ""
        }`}
        href={`/arama?q=${encodeURIComponent(normalizedQuery)}`}
        id={optionId("all")}
        onClick={() => closeSearch()}
        onFocus={() => setActiveKey("all")}
        role="option"
      >
        Tüm ürünleri görüntüle
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export function SearchResults({ variant }: { variant: "desktop" | "mobile" }) {
  const {
    normalizedQuery,
    status,
    data,
    currentData,
    displayData,
    retry,
    listboxId,
  } = useSearch();
  const mobile = variant === "mobile";

  if (normalizedQuery.length < 2) {
    return <SearchHint />;
  }

  if (!data) {
    if (status === "error") return <SearchError onRetry={retry} />;
    return <SearchSkeleton />;
  }

  if (status === "error") {
    return <SearchError onRetry={retry} />;
  }

  if (status === "success" && currentData) {
    if (
      currentData.categories.length === 0 &&
      currentData.products.length === 0
    ) {
      return <SearchEmpty />;
    }
  }

  if (!displayData) {
    return <SearchSkeleton />;
  }

  const hasCategories = displayData.categories.length > 0;
  const hasProducts = displayData.products.length > 0;

  return (
    <div
      aria-label="Arama sonuçları"
      className={`mt-5 ${status === "loading" ? "opacity-60" : ""}`}
      id={listboxId}
      role="listbox"
    >
      {status === "loading" ? (
        <div className="mb-4 h-px bg-brand-500/60 motion-safe:animate-pulse" />
      ) : null}

      {hasCategories ? (
        <div
          className={
            mobile
              ? "space-y-6"
              : hasProducts
                ? "grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]"
                : ""
          }
        >
          <CategorySection mobile={mobile} />
          {hasProducts ? <ProductSection mobile={mobile} /> : null}
        </div>
      ) : hasProducts ? (
        <ProductSection mobile={mobile} />
      ) : null}

      <ResultsFooter mobile={mobile} />
    </div>
  );
}
