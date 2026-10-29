"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { addToCartAction } from "@/app/actions/cart";
import { ProductImage } from "@/components/catalog/product-image";
import { formatPrice } from "@/lib/format";

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
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      disabled={disabled || pending}
      type="submit"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
  const [quantity, setQuantity] = useState(1);
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

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <ProductImage
            alt={productName}
            className="object-contain p-6"
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
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition ${
                  index === activeImage
                    ? "border-orange-500"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
                key={image}
                onClick={() => setActiveImage(index)}
                type="button"
              >
                <ProductImage
                  alt=""
                  className="object-contain p-1.5"
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
        <div className="flex flex-wrap items-center gap-2">
          {priceLabel ? (
            <span className="text-2xl font-bold text-zinc-900">
              {priceLabel}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
              Fiyat için teklif isteyin
            </span>
          )}
        </div>

        {selected && selected.stock !== null ? (
          selected.stock > 0 ? (
            <p className="mt-2 text-sm font-medium text-green-700">
              Stokta: {selected.stock.toLocaleString("tr-TR")} adet
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-red-600">
              Seçili varyant tükendi
            </p>
          )
        ) : null}

        {variants.length > 1 ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-zinc-800">
              Varyant seçin
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    variant.id === selected?.id
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                  key={variant.id}
                  onClick={() => selectVariant(variant.id)}
                  type="button"
                >
                  {variant.name}
                  {variant.stock === 0 ? (
                    <span className="block text-[11px] font-normal text-red-500">
                      Tükendi
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-xl border border-zinc-300">
            <button
              aria-label="Adet azalt"
              className="flex h-11 w-11 items-center justify-center text-lg text-zinc-600 transition hover:text-orange-600"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              type="button"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-zinc-900">
              {quantity}
            </span>
            <button
              aria-label="Adet artır"
              className="flex h-11 w-11 items-center justify-center text-lg text-zinc-600 transition hover:text-orange-600"
              onClick={() => setQuantity((value) => Math.min(999, value + 1))}
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

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
          <p>
            Siparişler kurumsal teklif olarak değerlendirilir. Ekibimiz
            siparişiniz sonrasında sizinle iletişime geçer.
          </p>
        </div>
      </div>
    </div>
  );
}
