"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { addToCartAction } from "@/app/actions/cart";
import { ProductImage } from "@/components/catalog/product-image";
import { QuoteActions } from "@/components/catalog/quote-actions";
import { primaryButtonClass } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";
import { clampQuantity, MAX_QUANTITY_DIGITS } from "@/lib/quantity";
import type { QuoteChannels } from "@/lib/quote";

export type ProductDetailVariant = {
  id: number;
  name: string;
  images: string[];
  price: number | null;
  stock: number | null;
};

function AddToCartButton({
  disabled,
  outOfStock,
}: {
  disabled: boolean;
  outOfStock?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={`${primaryButtonClass} px-6 py-3.5 sm:w-auto`}
      disabled={disabled || pending}
      type="submit"
    >
      <svg
        aria-hidden="true"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {outOfStock ? "Tükendi" : pending ? "Ekleniyor..." : "Sepete Ekle"}
    </button>
  );
}

function ImageLightbox({
  images,
  index,
  productName,
  onChange,
  onClose,
}: {
  images: string[];
  index: number;
  productName: string;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const total = images.length;
  const hasMultiple = total > 1;
  const image = images[index] ?? images[0] ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (!hasMultiple) return;
      if (event.key === "ArrowRight") onChange((index + 1) % total);
      if (event.key === "ArrowLeft") onChange((index - 1 + total) % total);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, index, onChange, onClose, total]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!image) return null;

  return createPortal(
    <div
      aria-modal="true"
      aria-label={`${productName} — tam ekran görsel`}
      className="fixed inset-0 z-[80] flex flex-col bg-ink/95"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex flex-1 flex-col">
        <div
          className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="min-w-0 truncate font-mono text-[11px] tracking-[0.16em] text-paper/55 uppercase">
            {productName}
            {hasMultiple ? (
              <span className="ml-3 text-paper/35">
                {index + 1} / {total}
              </span>
            ) : null}
          </p>
          <button
            aria-label="Tam ekranı kapat"
            className="shrink-0 rounded-sm border border-paper/20 px-3 py-2 font-mono text-[11px] tracking-[0.16em] text-paper/70 uppercase transition-colors hover:border-paper/50 hover:text-paper"
            onClick={onClose}
            type="button"
          >
            Kapat ×
          </button>
        </div>

        <div className="relative min-h-0 flex-1 px-4 pb-4 sm:px-16 sm:pb-10">
          <div
            className="relative h-full w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <ProductImage
              alt={productName}
              className="object-contain"
              fallbackClassName="flex h-full w-full items-center justify-center font-display text-8xl font-semibold text-brass-300/40"
              fallbackLabel={productName}
              sizes="100vw"
              src={image}
            />
          </div>

          {hasMultiple ? (
            <>
              <button
                aria-label="Önceki görsel"
                className="absolute top-1/2 left-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-sm border border-paper/20 bg-ink/60 text-paper/70 transition-colors hover:border-paper/50 hover:text-paper sm:left-6"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange((index - 1 + total) % total);
                }}
                type="button"
              >
                ←
              </button>
              <button
                aria-label="Sonraki görsel"
                className="absolute top-1/2 right-2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-sm border border-paper/20 bg-ink/60 text-paper/70 transition-colors hover:border-paper/50 hover:text-paper sm:right-6"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange((index + 1) % total);
                }}
                type="button"
              >
                →
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ProductDetail({
  categoryName,
  productName,
  productImages,
  quoteChannels,
  variants,
}: {
  categoryName: string | null;
  productName: string;
  productImages: string[];
  quoteChannels: QuoteChannels;
  variants: ProductDetailVariant[];
}) {
  const firstAvailableId =
    variants.find((variant) => variant.stock === null || variant.stock > 0)
      ?.id ?? variants[0]?.id ?? 0;
  const [selectedId, setSelectedId] = useState(firstAvailableId);
  const [activeImage, setActiveImage] = useState(0);
  const [quantityDraft, setQuantityDraft] = useState("1");
  const quantity = clampQuantity(Number(quantityDraft));
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const selected = useMemo(
    () => variants.find((variant) => variant.id === selectedId) ?? variants[0],
    [selectedId, variants]
  );

  const variantLabel =
    selected && selected.name !== productName ? selected.name : null;

  const prices = useMemo(
    () =>
      variants
        .map((variant) => variant.price)
        .filter((price): price is number => price !== null),
    [variants]
  );
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const galleryImages = useMemo(() => {
    const seen = new Set<string>();
    const images: string[] = [];
    for (const image of [...productImages, ...(selected?.images ?? [])]) {
      if (!image || seen.has(image)) continue;
      seen.add(image);
      images.push(image);
    }
    return images;
  }, [productImages, selected]);

  const visibleImages = galleryImages.filter(
    (image) => !failedImages.includes(image)
  );
  const activeIndex =
    visibleImages.length > 0
      ? Math.min(activeImage, visibleImages.length - 1)
      : 0;
  const currentImage = visibleImages[activeIndex] ?? null;

  const priceLabel = selected?.price
    ? formatPrice(selected.price)
    : minPrice !== null
      ? minPrice === maxPrice
        ? formatPrice(minPrice)
        : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : null;

  function selectVariant(id: number) {
    setSelectedId(id);
  }

  function markImageFailed(image: string) {
    setFailedImages((current) =>
      current.includes(image) ? current : [...current, image]
    );
    setActiveImage(0);
  }

  function stepQuantity(delta: number) {
    setQuantityDraft((draft) =>
      String(clampQuantity(clampQuantity(Number(draft)) + delta))
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <button
            aria-label="Görseli tam ekran görüntüle"
            className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-sm border border-line bg-surface/50"
            disabled={!currentImage}
            onClick={() => setLightboxOpen(true)}
            type="button"
          >
            <ProductImage
              alt={productName}
              className="object-contain p-6 mix-blend-multiply"
              fallbackClassName="flex h-full w-full items-center justify-center bg-surface font-display text-7xl font-semibold text-brass-300"
              fallbackLabel={productName}
              onError={() => {
                if (currentImage) markImageFailed(currentImage);
              }}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              src={currentImage}
            />
            <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-sm border border-line bg-paper/90 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase transition-colors group-hover:border-ink group-hover:text-ink">
              <svg
                aria-hidden="true"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">Tam ekran</span>
            </span>
          </button>
          {visibleImages.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {visibleImages.map((image, index) => (
                <button
                  aria-current={index === activeIndex ? "true" : undefined}
                  aria-label={`${index + 1}. görsel`}
                  className={`relative size-20 shrink-0 cursor-pointer overflow-hidden rounded-sm border bg-paper transition-colors ${
                    index === activeIndex
                      ? "border-ink"
                      : "border-line hover:border-line-strong"
                  }`}
                  key={image}
                  onClick={() => setActiveImage(index)}
                  onFocus={() => setActiveImage(index)}
                  onMouseEnter={() => setActiveImage(index)}
                  type="button"
                >
                  <ProductImage
                    alt=""
                    className="object-contain p-1.5 mix-blend-multiply"
                    fallbackLabel={productName}
                    onError={() => markImageFailed(image)}
                    sizes="80px"
                    src={image}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col">
          {priceLabel ? (
            <p className="font-display text-[2rem] leading-none font-semibold text-ink">
              {priceLabel}
            </p>
          ) : (
            <p className="w-fit border-b border-brass-500 pb-1 font-mono text-[11px] tracking-[0.2em] text-brass-700 uppercase">
              Fiyat için teklif alın
            </p>
          )}

          {selected && selected.stock !== null ? (
            selected.stock > 0 ? (
              <p className="mt-4 font-mono text-[11px] tracking-[0.16em] text-brand-600 uppercase">
                Stokta · {selected.stock.toLocaleString("tr-TR")} adet
              </p>
            ) : (
              <p className="mt-4 font-mono text-[11px] tracking-[0.16em] text-red-700 uppercase">
                Seçili varyant tükendi
              </p>
            )
          ) : null}

          {variants.length > 1 ? (
            <div className="mt-8 border-t border-line pt-6">
              <p className="eyebrow">Varyant seçin</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    className={`rounded-sm border px-4 py-2.5 text-sm transition-colors ${
                      variant.id === selected?.id
                        ? "border-ink bg-surface text-ink"
                        : "border-line bg-paper text-ink-muted hover:border-line-strong hover:text-ink"
                    }`}
                    key={variant.id}
                    onClick={() => selectVariant(variant.id)}
                    type="button"
                  >
                    {variant.name}
                    {variant.stock === 0 ? (
                      <span className="mt-0.5 block font-mono text-[10px] tracking-[0.14em] text-red-700 uppercase">
                        Tükendi
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-sm border border-line">
              <button
                aria-label="Adet azalt"
                className="flex size-11 items-center justify-center text-lg text-ink-muted transition-colors hover:text-ink"
                onClick={() => stepQuantity(-1)}
                type="button"
              >
                −
              </button>
              <input
                aria-label="Adet"
                autoComplete="off"
                className="w-16 border-x border-line bg-transparent py-3 text-center font-mono text-sm text-ink outline-none focus:bg-surface/50"
                inputMode="numeric"
                onBlur={() =>
                  setQuantityDraft((draft) =>
                    String(clampQuantity(Number(draft)))
                  )
                }
                onChange={(event) =>
                  setQuantityDraft(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, MAX_QUANTITY_DIGITS)
                  )
                }
                type="text"
                value={quantityDraft}
              />
              <button
                aria-label="Adet artır"
                className="flex size-11 items-center justify-center text-lg text-ink-muted transition-colors hover:text-ink"
                onClick={() => stepQuantity(1)}
                type="button"
              >
                +
              </button>
            </div>
            <form action={addToCartAction} className="flex-1">
              <input name="variantId" type="hidden" value={selected?.id ?? ""} />
              <input name="quantity" type="hidden" value={quantity} />
              <AddToCartButton
                disabled={!selected || selected.stock === 0}
                outOfStock={selected?.stock === 0}
              />
            </form>
          </div>

          <div className="mt-4">
            <QuoteActions
              channels={quoteChannels}
              request={{
                categoryName,
                productName,
                quantity,
                variantName: variantLabel,
              }}
            />
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <p className="eyebrow">Teklif süreci</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-muted">
              Siparişler kurumsal teklif olarak değerlendirilir. Ekibimiz
              siparişiniz sonrasında sizinle iletişime geçer.
            </p>
          </div>
        </div>
      </div>
      {lightboxOpen && visibleImages.length > 0 ? (
        <ImageLightbox
          images={visibleImages}
          index={activeIndex}
          onChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
          productName={productName}
        />
      ) : null}
    </>
  );
}
