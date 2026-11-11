"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import {
  updateProductAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { deleteProductImageAction } from "@/app/actions/products";
import { CategorySelect } from "@/components/admin/category-select";
import {
  VariantEditor,
  type VariantDraft,
} from "@/components/admin/variant-editor";
import { inputClass, labelClass } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";
import { dedupeImages, isProductImageUrl } from "@/lib/image-urls";
import type { CategoryOption } from "@/lib/types";

const initialState: AdminActionState = {};

type VariantInput = {
  id: number;
  name: string;
  price: number | null;
  netPrice: number | null;
  discount: number | null;
  stock: number | null;
  is_hidden: number;
  active: number;
  images: string[];
};

type ProductInput = {
  id: number;
  name: string;
  code: string;
  slug: string;
  source: string;
  description: string | null;
  descriptionText: string;
  tags: string | null;
  category_id: number | null;
  categoryName: string | null;
  is_featured: number;
  is_hidden: number;
  meta_title: string | null;
  meta_description: string | null;
  images: string[];
};

export function ProductEditForm({
  product,
  variants,
  categories,
}: {
  product: ProductInput;
  variants: VariantInput[];
  categories: CategoryOption[];
}) {
  const [state, action, pending] = useActionState(
    updateProductAction,
    initialState
  );
  const pendingUploads = useRef(new Set<string>());
  const [uploading, setUploading] = useState(0);
  const lastNonce = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!state.nonce || state.nonce === lastNonce.current) return;
    lastNonce.current = state.nonce;
    const urls = [...pendingUploads.current];
    pendingUploads.current.clear();
    for (const url of urls) void deleteProductImageAction(url);
  }, [state]);

  useEffect(() => {
    const uploads = pendingUploads.current;
    return () => {
      const urls = [...uploads];
      uploads.clear();
      for (const url of urls) void deleteProductImageAction(url);
    };
  }, []);

  if (product.source === "manual") {
    return (
      <ManualProductFields
        action={action}
        categories={categories}
        key={state.nonce ?? `product-${product.id}`}
        onUploaded={(url) => pendingUploads.current.add(url)}
        onUploadingChange={setUploading}
        pending={pending}
        product={product}
        state={state}
        uploading={uploading}
        variants={variants}
      />
    );
  }

  return (
    <XmlProductForm
      action={action}
      pending={pending}
      product={product}
      state={state}
      variants={variants}
    />
  );
}

function ManualProductFields({
  action,
  categories,
  onUploaded,
  onUploadingChange,
  pending,
  product,
  state,
  uploading,
  variants,
}: {
  action: (formData: FormData) => void;
  categories: CategoryOption[];
  onUploaded: (url: string) => void;
  onUploadingChange: (pending: number) => void;
  pending: boolean;
  product: ProductInput;
  state: AdminActionState;
  uploading: number;
  variants: VariantInput[];
}) {
  const [drafts, setDrafts] = useState<VariantDraft[]>(() =>
    variants.map((variant) => ({
      key: `variant-${variant.id}`,
      id: variant.id,
      name: variant.name,
      price: variant.price === null ? "" : String(variant.price),
      stock: variant.stock === null ? "" : String(variant.stock),
      imageUrlsText: variant.images
        .filter((url) => !isProductImageUrl(url))
        .join(", "),
      uploads: variant.images.filter(isProductImageUrl),
      isHidden: variant.is_hidden === 1,
    }))
  );

  const payload = drafts.map((draft) => ({
    id: draft.id,
    name: draft.name,
    price: draft.price,
    stock: draft.stock,
    imageUrls: draft.imageUrlsText
      .split(/[,\n\r]+/)
      .map((url) => url.trim())
      .filter(Boolean),
    uploads: draft.uploads,
    isHidden: draft.isHidden,
  }));

  return (
    <form action={action} className="space-y-6">
      <input name="productId" type="hidden" value={product.id} />
      <input name="variants" type="hidden" value={JSON.stringify(payload)} />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-zinc-800">Ürün bilgileri</p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
            Manuel ürün · /urun/{product.slug}
          </span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="edit-product-name">
              Ürün adı
            </label>
            <input
              className={inputClass}
              defaultValue={product.name}
              id="edit-product-name"
              name="name"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-product-code">
              Ürün kodu
            </label>
            <input
              className={inputClass}
              defaultValue={product.code}
              id="edit-product-code"
              name="code"
              required
            />
          </div>

          <CategorySelect
            categories={categories}
            defaultValue={product.category_id}
            id="edit-product-category"
          />

          <div>
            <label className={labelClass} htmlFor="edit-product-tags">
              Etiketler
            </label>
            <input
              className={inputClass}
              defaultValue={product.tags ?? ""}
              id="edit-product-tags"
              name="tags"
              placeholder="Virgülle ayırın"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="edit-product-image-urls">
              Ürün görselleri (virgülle ayırın)
            </label>
            <textarea
              className={`${inputClass} min-h-20`}
              defaultValue={product.images.join(", ")}
              id="edit-product-image-urls"
              name="imageUrls"
              placeholder="https://ornek.com/1.jpg, https://ornek.com/2.jpg"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Yalnızca http(s) adresleri. Varyant görselleri aşağıdan eklenir.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="edit-product-description">
              Açıklama
            </label>
            <textarea
              className={`${inputClass} min-h-24`}
              defaultValue={product.description ?? ""}
              id="edit-product-description"
              name="description"
            />
          </div>

          <div className="flex flex-wrap gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                className="h-4 w-4 accent-orange-600"
                defaultChecked={product.is_featured === 1}
                name="isFeatured"
                type="checkbox"
              />
              Öne çıkan ürün
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                className="h-4 w-4 accent-orange-600"
                defaultChecked={product.is_hidden === 1}
                name="isHidden"
                type="checkbox"
              />
              Sitede gizle
            </label>
          </div>
        </div>
      </div>

      <SeoFields product={product} />

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100/60 p-4">
        <p className="mb-3 text-sm font-bold text-zinc-800">Varyantlar</p>
        <VariantEditor
          disabled={pending}
          onChange={setDrafts}
          onUploaded={onUploaded}
          onUploadingChange={onUploadingChange}
          showHidden
          variants={drafts}
        />
      </div>

      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <button
        className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || uploading > 0}
        type="submit"
      >
        {uploading > 0
          ? "Görseller yükleniyor..."
          : pending
            ? "Kaydediliyor..."
            : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}

function SeoFields({ product }: { product: ProductInput }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-semibold text-zinc-800">SEO metinleri</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="product-meta-title">
            SEO başlığı
          </label>
          <input
            className={inputClass}
            defaultValue={product.meta_title ?? ""}
            id="product-meta-title"
            name="metaTitle"
            placeholder="Boş bırakılırsa ürün adı kullanılır"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="product-meta-description">
            SEO açıklaması
          </label>
          <textarea
            className={`${inputClass} min-h-20`}
            defaultValue={product.meta_description ?? ""}
            id="product-meta-description"
            name="metaDescription"
            placeholder="Boş bırakılırsa ürün açıklamasından üretilir"
          />
        </div>
      </div>
    </div>
  );
}

function XmlProductForm({
  action,
  pending,
  product,
  state,
  variants,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  product: ProductInput;
  state: AdminActionState;
  variants: VariantInput[];
}) {
  const gallery = dedupeImages([
    ...product.images,
    ...variants.flatMap((variant) => variant.images),
  ]).slice(0, 4);

  return (
    <form action={action} className="space-y-6">
      <input name="productId" type="hidden" value={product.id} />

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-zinc-800">
              XML beslemesinden yönetilir
            </p>
            <p className="text-xs text-zinc-500">
              Ad, kod, açıklama, kategori ve görseller beslemeden gelir; burada
              düzenlenemez.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
            Kod: {product.code}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Kategori
            </dt>
            <dd className="text-zinc-700">{product.categoryName ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Adres
            </dt>
            <dd className="text-zinc-700">/urun/{product.slug}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Açıklama
            </dt>
            <dd className="line-clamp-3 text-zinc-600">
              {product.descriptionText || "-"}
            </dd>
          </div>
          {gallery.length > 0 ? (
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Görseller
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {gallery.map((url) => (
                  <span
                    className="h-16 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                    key={url}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Ürün görseli"
                      className="h-full w-full object-cover"
                      src={url}
                    />
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap gap-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={product.is_featured === 1}
            name="isFeatured"
            type="checkbox"
          />
          Öne çıkan ürün
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={product.is_hidden === 1}
            name="isHidden"
            type="checkbox"
          />
          Sitede gizle
        </label>
      </div>

      <SeoFields product={product} />

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Varyant</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 font-semibold">Fiyat (TL)</th>
              <th className="px-4 py-3 font-semibold">Gizli</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-800">{variant.name}</p>
                  <p className="text-xs text-zinc-400">#{variant.id}</p>
                </td>
                <td className="px-4 py-3">
                  {variant.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Aktif
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                      Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    className={`${inputClass} max-w-40`}
                    defaultValue={variant.price ?? ""}
                    min="0"
                    name={`price_${variant.id}`}
                    placeholder="Boş = teklif"
                    step="0.01"
                    type="number"
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Net: {formatPrice(variant.netPrice) ?? "—"}
                    {variant.discount !== null && variant.discount > 0
                      ? ` · %${Math.round(variant.discount * 100)} iskonto`
                      : ""}
                    {variant.stock !== null
                      ? ` · Stok: ${variant.stock.toLocaleString("tr-TR")}`
                      : ""}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <input
                    className="h-4 w-4 accent-orange-600"
                    defaultChecked={variant.is_hidden === 1}
                    name={`hidden_${variant.id}`}
                    type="checkbox"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <button
        className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}
