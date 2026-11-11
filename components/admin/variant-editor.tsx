"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { uploadProductImageAction } from "@/app/actions/products";
import { inputClass, labelClass } from "@/components/ui/styles";
import {
  dedupeImages,
  parseImageUrlList,
} from "@/lib/image-urls";
import {
  MAX_IMAGES_PER_VARIANT,
  MAX_VARIANTS,
} from "@/lib/product-limits";

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/avif";

export type VariantDraft = {
  key: string;
  id?: number;
  name: string;
  price: string;
  stock: string;
  imageUrlsText: string;
  uploads: string[];
  isHidden: boolean;
};

export function createVariantDraft(): VariantDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    price: "",
    stock: "",
    imageUrlsText: "",
    uploads: [],
    isHidden: false,
  };
}

export function draftImages(draft: VariantDraft): string[] {
  return dedupeImages([
    ...parseImageUrlList(draft.imageUrlsText, true),
    ...draft.uploads,
  ]);
}

export function VariantEditor({
  variants,
  onChange,
  onUploaded,
  onUploadingChange,
  showHidden = false,
  disabled = false,
}: {
  variants: VariantDraft[];
  onChange: Dispatch<SetStateAction<VariantDraft[]>>;
  onUploaded?: (url: string) => void;
  onUploadingChange?: (pending: number) => void;
  showHidden?: boolean;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(0);
  const [busyKeys, setBusyKeys] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  function patchVariant(key: string, patch: Partial<VariantDraft>) {
    onChange((previous) =>
      previous.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant
      )
    );
  }

  function appendUploads(key: string, urls: string[]) {
    onChange((previous) =>
      previous.map((variant) =>
        variant.key === key
          ? { ...variant, uploads: [...variant.uploads, ...urls] }
          : variant
      )
    );
  }

  function addVariant() {
    onChange((previous) => [...previous, createVariantDraft()]);
  }

  function removeVariant(key: string) {
    onChange((previous) =>
      previous.length <= 1
        ? previous
        : previous.filter((variant) => variant.key !== key)
    );
  }

  function removeImage(key: string, url: string) {
    onChange((previous) =>
      previous.map((variant) => {
        if (variant.key !== key) return variant;
        if (variant.uploads.includes(url)) {
          return {
            ...variant,
            uploads: variant.uploads.filter((item) => item !== url),
          };
        }
        const remaining = parseImageUrlList(
          variant.imageUrlsText,
          true
        ).filter((item) => item !== url);
        return { ...variant, imageUrlsText: remaining.join(", ") };
      })
    );
  }

  async function handleFiles(key: string, event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setBusyKeys((prev) => [...prev, key]);
    setUploading((count) => count + files.length);

    for (const file of files) {
      const formData = new FormData();
      formData.append("image", file);
      const result = await uploadProductImageAction(formData);
      setUploading((count) => Math.max(0, count - 1));

      if ("error" in result) {
        setErrors((prev) => ({ ...prev, [key]: result.error }));
        continue;
      }
      appendUploads(key, [result.url]);
      onUploaded?.(result.url);
    }

    setBusyKeys((prev) => prev.filter((item) => item !== key));
  }

  const uploadsDisabled =
    disabled || uploading > 0;

  return (
    <div className="space-y-4">
      {variants.map((variant, index) => {
        const busy = busyKeys.includes(variant.key);
        const images = draftImages(variant);
        const inputId = `variant-upload-${variant.key}`;

        return (
          <div
            className="rounded-2xl border border-zinc-200 bg-white p-4"
            key={variant.key}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-zinc-800">
                  Varyant {index + 1}
                </p>
                {variant.id ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                    #{variant.id}
                  </span>
                ) : (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                    Yeni
                  </span>
                )}
              </div>
              <button
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={disabled || variants.length <= 1}
                onClick={() => removeVariant(variant.key)}
                type="button"
              >
                Varyantı kaldır
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label
                  className={labelClass}
                  htmlFor={`variant-name-${variant.key}`}
                >
                  Varyant adı
                </label>
                <input
                  className={inputClass}
                  disabled={disabled}
                  id={`variant-name-${variant.key}`}
                  onChange={(event) =>
                    patchVariant(variant.key, { name: event.target.value })
                  }
                  placeholder={
                    variants.length === 1
                      ? "Boş bırakılırsa ürün adı kullanılır"
                      : "Örn. Kırmızı / XL"
                  }
                  value={variant.name}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`variant-price-${variant.key}`}
                >
                  Fiyat (TL)
                </label>
                <input
                  className={inputClass}
                  disabled={disabled}
                  id={`variant-price-${variant.key}`}
                  inputMode="decimal"
                  onChange={(event) =>
                    patchVariant(variant.key, { price: event.target.value })
                  }
                  placeholder="Boş = teklif"
                  value={variant.price}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`variant-stock-${variant.key}`}
                >
                  Stok
                </label>
                <input
                  className={inputClass}
                  disabled={disabled}
                  id={`variant-stock-${variant.key}`}
                  min="0"
                  onChange={(event) =>
                    patchVariant(variant.key, { stock: event.target.value })
                  }
                  placeholder="Boş = belirtilmedi"
                  step="1"
                  type="number"
                  value={variant.stock}
                />
              </div>
            </div>

            {showHidden ? (
              <label className="mt-3 flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  checked={variant.isHidden}
                  className="h-4 w-4 accent-orange-600"
                  disabled={disabled}
                  onChange={(event) =>
                    patchVariant(variant.key, {
                      isHidden: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                Varyantı sitede gizle
              </label>
            ) : null}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div>
                <label
                  className={labelClass}
                  htmlFor={`variant-urls-${variant.key}`}
                >
                  Görsel URL&apos;leri (virgülle ayırın)
                </label>
                <textarea
                  className={`${inputClass} min-h-20`}
                  disabled={disabled}
                  id={`variant-urls-${variant.key}`}
                  onChange={(event) =>
                    patchVariant(variant.key, {
                      imageUrlsText: event.target.value,
                    })
                  }
                  placeholder="https://ornek.com/1.jpg, https://ornek.com/2.jpg"
                  value={variant.imageUrlsText}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={inputId}>
                  veya dosya yükle
                </label>
                <input
                  accept={ACCEPTED_TYPES}
                  className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700 disabled:opacity-60"
                  disabled={
                    uploadsDisabled ||
                    busy ||
                    images.length >= MAX_IMAGES_PER_VARIANT
                  }
                  id={inputId}
                  multiple
                  onChange={(event) => handleFiles(variant.key, event)}
                  type="file"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  JPEG, PNG, WEBP, GIF veya AVIF • en fazla 5 MB •{" "}
                  {MAX_IMAGES_PER_VARIANT} görsel
                </p>
                {busy ? (
                  <p className="mt-1 text-xs font-semibold text-orange-600">
                    Yükleniyor...
                  </p>
                ) : null}
                {errors[variant.key] ? (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors[variant.key]}
                  </p>
                ) : null}
              </div>
            </div>

            {images.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {images.map((url) => {
                  const uploaded = variant.uploads.includes(url);
                  return (
                    <li
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                      key={url}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Varyant görseli"
                        className="h-full w-full object-cover"
                        src={url}
                      />
                      {uploaded ? (
                        <span className="absolute bottom-0 left-0 bg-zinc-900/70 px-1 text-[10px] font-semibold text-white">
                          Yüklendi
                        </span>
                      ) : null}
                      <button
                        aria-label="Görseli kaldır"
                        className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center bg-zinc-900/70 text-xs font-bold text-white transition hover:bg-red-600"
                        disabled={disabled}
                        onClick={() => removeImage(variant.key, url)}
                        type="button"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || variants.length >= MAX_VARIANTS}
          onClick={addVariant}
          type="button"
        >
          + Yeni varyant ekle
        </button>
        <p className="text-xs text-zinc-400">
          {variants.length} / {MAX_VARIANTS} varyant
        </p>
      </div>
    </div>
  );
}
