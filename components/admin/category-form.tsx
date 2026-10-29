"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";
import { updateCategoryAction } from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";

export type CategoryAdminRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  active: number;
  parent_name: string | null;
  product_count: number;
};

const fileInputClass =
  "block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700";

export function CategoryForm({ category }: { category: CategoryAdminRow }) {
  const [state, formAction, pending] = useActionState(updateCategoryAction, {});

  return (
    <CategoryFormFields
      category={category}
      formAction={formAction}
      key={state.nonce ?? `category-${category.id}`}
      pending={pending}
      state={state}
    />
  );
}

function CategoryFormFields({
  category,
  formAction,
  pending,
  state,
}: {
  category: CategoryAdminRow;
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: Awaited<ReturnType<typeof updateCategoryAction>>;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const imageSrc = preview ?? (removeImage ? null : category.image_url);
  const initial =
    category.name.trim().charAt(0).toLocaleUpperCase("tr") || "?";
  const imageInputId = `category-image-${category.id}`;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoveImage(false);
  }

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_100px_90px_100px]"
    >
      <input name="categoryId" type="hidden" value={category.id} />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-800">
          {category.name}
        </p>
        <p className="truncate text-xs text-zinc-400">
          {category.parent_name ? `${category.parent_name} > ` : ""}
          {category.slug} • {category.product_count} ürün
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor={imageInputId}>
          Görsel
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${category.name} görseli`}
              className="h-16 w-16 shrink-0 rounded-lg border border-zinc-200 object-cover"
              src={imageSrc}
            />
          ) : (
            <div
              aria-label={`${category.name} için görsel yok`}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-gradient-to-br from-orange-50 to-zinc-100 text-xl font-bold text-orange-200"
              role="img"
            >
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <input
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className={fileInputClass}
              id={imageInputId}
              name="image"
              onChange={handleFileChange}
              type="file"
            />
            <p className="mt-1 text-xs text-zinc-400">
              JPEG, PNG, WEBP, GIF veya AVIF • en fazla 5 MB
            </p>
            {category.image_url && !preview ? (
              <label className="mt-2 flex items-center gap-2 text-xs font-medium text-zinc-600">
                <input
                  checked={removeImage}
                  className="h-4 w-4 accent-orange-600"
                  name="removeImage"
                  onChange={(event) => setRemoveImage(event.target.checked)}
                  type="checkbox"
                />
                Mevcut görseli kaldır
              </label>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`category-sort-${category.id}`}>
          Sıra
        </label>
        <input
          className={inputClass}
          defaultValue={category.sort_order}
          id={`category-sort-${category.id}`}
          name="sortOrder"
          type="number"
        />
      </div>

      <label className="flex items-center gap-2 pt-6 text-sm font-medium text-zinc-700">
        <input
          className="h-4 w-4 accent-orange-600"
          defaultChecked={category.active === 1}
          name="active"
          type="checkbox"
        />
        Aktif
      </label>

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>

      {state.error || (state.ok && state.message) ? (
        <div className="lg:col-span-5">
          {state.error ? (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              {state.message}
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}
