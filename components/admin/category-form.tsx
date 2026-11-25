"use client";

import {
  useActionState,
  useEffect,
  useMemo,
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
  show_on_home: number;
  meta_title: string | null;
  meta_description: string | null;
  parent_name: string | null;
  product_count: number;
};

const fileInputClass =
  "block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700";

export type CategoryOrderDraft = {
  sortOrder: string;
  showOnHome: boolean;
};

function collectSelfAndDescendants(
  categories: CategoryAdminRow[],
  id: number,
): Set<number> {
  const excluded = new Set<number>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of categories) {
      if (
        category.parent_id !== null &&
        excluded.has(category.parent_id) &&
        !excluded.has(category.id)
      ) {
        excluded.add(category.id);
        changed = true;
      }
    }
  }
  return excluded;
}

function buildParentChoices(
  categories: CategoryAdminRow[],
  excluded: Set<number>,
): { id: number; label: string }[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categories
    .filter((category) => !excluded.has(category.id))
    .map((category) => {
      const chain: string[] = [];
      let current = category.parent_id
        ? byId.get(category.parent_id)
        : undefined;
      let guard = 0;
      while (current && guard < 10) {
        chain.unshift(current.name);
        current = current.parent_id ? byId.get(current.parent_id) : undefined;
        guard += 1;
      }
      return {
        id: category.id,
        label: [...chain, category.name].join(" › "),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

export function CategoryForm({
  category,
  categories,
  draft,
  onDraftChange,
}: {
  category: CategoryAdminRow;
  categories: CategoryAdminRow[];
  draft?: CategoryOrderDraft;
  onDraftChange: (patch: Partial<CategoryOrderDraft>) => void;
}) {
  const [state, formAction, pending] = useActionState(updateCategoryAction, {});

  return (
    <CategoryFormFields
      categories={categories}
      category={category}
      draft={draft}
      formAction={formAction}
      key={state.nonce ?? `category-${category.id}`}
      onDraftChange={onDraftChange}
      pending={pending}
      state={state}
    />
  );
}

function CategoryFormFields({
  category,
  categories,
  draft,
  formAction,
  onDraftChange,
  pending,
  state,
}: {
  category: CategoryAdminRow;
  categories: CategoryAdminRow[];
  draft?: CategoryOrderDraft;
  formAction: (formData: FormData) => void;
  onDraftChange: (patch: Partial<CategoryOrderDraft>) => void;
  pending: boolean;
  state: Awaited<ReturnType<typeof updateCategoryAction>>;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const parentChoices = useMemo(
    () =>
      buildParentChoices(
        categories,
        collectSelfAndDescendants(categories, category.id),
      ),
    [categories, category.id],
  );

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
      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.7fr)_90px_90px_110px_100px]"
    >
      <input name="categoryId" type="hidden" value={category.id} />

      <div className="min-w-0 space-y-2">
        <div>
          <label
            className={labelClass}
            htmlFor={`category-name-${category.id}`}
          >
            Ad
          </label>
          <input
            className={inputClass}
            defaultValue={category.name}
            id={`category-name-${category.id}`}
            name="name"
            required
          />
        </div>
        <div>
          <label
            className={labelClass}
            htmlFor={`category-parent-${category.id}`}
          >
            Üst kategori
          </label>
          <select
            className={inputClass}
            defaultValue={
              category.parent_id === null ? "" : String(category.parent_id)
            }
            id={`category-parent-${category.id}`}
            name="parentId"
          >
            <option value="">Kök kategori (ana kategori)</option>
            {parentChoices.map((choice) => (
              <option key={choice.id} value={String(choice.id)}>
                {choice.label}
              </option>
            ))}
          </select>
          <p className="mt-1 truncate text-xs text-zinc-400">
            {category.product_count} ürün • {category.parent_name ?? "Ana kategori"}
          </p>
        </div>
        <div>
          <label
            className={labelClass}
            htmlFor={`category-slug-${category.id}`}
          >
            Adres (slug)
          </label>
          <input
            className={inputClass}
            defaultValue={category.slug}
            id={`category-slug-${category.id}`}
            name="slug"
          />
        </div>
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
          id={`category-sort-${category.id}`}
          name="sortOrder"
          onChange={(event) => onDraftChange({ sortOrder: event.target.value })}
          type="number"
          value={draft?.sortOrder ?? String(category.sort_order)}
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

      <label
        className="flex items-center gap-2 pt-6 text-sm font-medium text-zinc-700"
        title="Ana sayfadaki Ürün Grupları bölümünde göster"
      >
        <input
          checked={draft?.showOnHome ?? category.show_on_home === 1}
          className="h-4 w-4 accent-orange-600"
          name="showOnHome"
          onChange={(event) =>
            onDraftChange({ showOnHome: event.target.checked })
          }
          type="checkbox"
        />
        Ana sayfa
      </label>

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>

      {state.error || (state.ok && state.message) ? (
        <div className="lg:col-span-6">
          {state.error ? (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              {state.message}
            </p>
          )}
        </div>
      ) : null}

      <details className="lg:col-span-6 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500">
          SEO metinleri
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label
              className={labelClass}
              htmlFor={`category-meta-title-${category.id}`}
            >
              SEO başlığı
            </label>
            <input
              className={inputClass}
              defaultValue={category.meta_title ?? ""}
              id={`category-meta-title-${category.id}`}
              name="metaTitle"
              placeholder={`${category.name} Ürünleri`}
            />
          </div>
          <div>
            <label
              className={labelClass}
              htmlFor={`category-meta-description-${category.id}`}
            >
              SEO açıklaması
            </label>
            <textarea
              className={`${inputClass} min-h-20`}
              defaultValue={category.meta_description ?? ""}
              id={`category-meta-description-${category.id}`}
              name="metaDescription"
              placeholder="Boş bırakılırsa otomatik açıklama kullanılır"
            />
          </div>
        </div>
      </details>
    </form>
  );
}
