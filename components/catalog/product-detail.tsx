"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { addToCartAction } from "@/app/actions/cart";
import { ProductImage } from "@/components/catalog/product-image";
import { primaryButtonClass } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";
import { clampQuantity, MAX_QUANTITY_DIGITS } from "@/lib/quantity";

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

export function ProductDetail({
  productName,
  variants,
}: {
  productName: string;
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

  const selected = useMemo(
    () => variants.find((variant) => variant.id === selectedId) ?? variants[0],
    [selectedId, variants]
  );

  const prices = useMemo(
    () =>
      variants
        .map((variant) => variant.price)
        .filter((price): price is number => price !== null),
    [variants]
  );
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const visibleImages = (selected?.images ?? []).filter(
    (image) => !failedImages.includes(image)
  );
  const currentImage = visibleImages[activeImage] ?? visibleImages[0] ?? null;

  const priceLabel = selected?.price
    ? formatPrice(selected.price)
    : minPrice !== null
      ? minPrice === maxPrice
        ? formatPrice(minPrice)
        : `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
      : null;

  function selectVariant(id: number) {
    setSelectedId(id);
    setActiveImage(0);
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
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-line bg-surface/50">
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
        </div>
        {visibleImages.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {visibleImages.map((image, index) => (
              <button
                aria-label={`${index + 1}. görsel`}
                className={`relative size-20 shrink-0 overflow-hidden rounded-sm border bg-paper transition-colors ${
                  index === activeImage
                    ? "border-ink"
                    : "border-line hover:border-line-strong"
                }`}
                key={image}
                onClick={() => setActiveImage(index)}
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

        <div className="mt-8 border-t border-line pt-6">
          <p className="eyebrow">Teklif süreci</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-ink-muted">
            Siparişler kurumsal teklif olarak değerlendirilir. Ekibimiz
            siparişiniz sonrasında sizinle iletişime geçer.
          </p>
        </div>
      </div>
    </div>
  );
}
