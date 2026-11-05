"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  saveCollectionAction,
  searchCollectionProductsAction,
} from "@/app/actions/collections";
import { inputClass, labelClass } from "@/components/ui/styles";
import type {
  CategoryOption,
  Collection,
  CollectionProductOption,
} from "@/lib/types";

function categoryDepth(
  category: CategoryOption,
  byId: Map<number, CategoryOption>
): number {
  let depth = 0;
  let current = category;
  while (current.parent_id !== null && depth < 10) {
    const parent = byId.get(current.parent_id);
    if (!parent) break;
    depth += 1;
    current = parent;
  }
  return depth;
}

function SmallButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function CollectionForm({
  categories,
  categoryIds,
  collection,
  products,
}: {
  categories: CategoryOption[];
  categoryIds: number[];
  collection: Collection;
  products: CollectionProductOption[];
}) {
  const [state, formAction, pending] = useActionState(
    saveCollectionAction,
    {}
  );

  const [selectedProducts, setSelectedProducts] =
    useState<CollectionProductOption[]>(products);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(
    () => new Set(categoryIds)
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CollectionProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestId.current += 1;
      return;
    }

    const current = requestId.current + 1;
    requestId.current = current;
    const timer = setTimeout(() => {
      setSearching(true);
      searchCollectionProductsAction(trimmed)
        .then((response) => {
          if (requestId.current !== current) return;
          setResults(response.items);
        })
        .catch(() => {
          if (requestId.current !== current) return;
          setResults([]);
        })
        .finally(() => {
          if (requestId.current === current) setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const selectedProductIds = new Set(selectedProducts.map((item) => item.id));
  const categoryById = new Map(categories.map((item) => [item.id, item]));

  function addProduct(product: CollectionProductOption) {
    setSelectedProducts((current) =>
      current.some((item) => item.id === product.id)
        ? current
        : [...current, product]
    );
  }

  function removeProduct(productId: number) {
    setSelectedProducts((current) =>
      current.filter((item) => item.id !== productId)
    );
  }

  function moveProduct(index: number, direction: -1 | 1) {
    setSelectedProducts((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleCategory(categoryId: number) {
    setSelectedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="collectionId" type="hidden" value={collection.id} />
      <input
        name="products"
        type="hidden"
        value={JSON.stringify(selectedProducts.map((item) => item.id))}
      />
      <input
        name="categoryIds"
        type="hidden"
        value={JSON.stringify(Array.from(selectedCategoryIds))}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="collection-name">
              Koleksiyon adı
            </label>
            <input
              className={inputClass}
              defaultValue={collection.name}
              id="collection-name"
              name="name"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="collection-slug">
              Adres (slug)
            </label>
            <input
              className={inputClass}
              defaultValue={collection.slug}
              id="collection-slug"
              name="slug"
            />
            <p className="mt-1 text-xs text-zinc-400">
              /koleksiyon/{collection.slug}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="collection-description">
              Açıklama
            </label>
            <textarea
              className={inputClass}
              defaultValue={collection.description ?? ""}
              id="collection-description"
              name="description"
              rows={2}
            />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={collection.active === 1}
            name="active"
            type="checkbox"
          />
          Aktif
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={collection.include_children === 1}
            name="includeChildren"
            type="checkbox"
          />
          Alt kategorilerdeki ürünleri de dahil et
        </label>
        <p className="mt-1 ml-6 text-xs text-zinc-400">
          Kapalıyken yalnızca seçilen kategorilerin doğrudan ürünleri eklenir.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-zinc-800">Manuel ürünler</h3>
          <p className="text-xs text-zinc-400">
            {selectedProducts.length} ürün · sıra buradaki listedir
          </p>
        </div>

        <div className="mt-3">
          <label className={labelClass} htmlFor="collection-product-search">
            Ürün ara
          </label>
          <input
            className={inputClass}
            id="collection-product-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün adı veya kodu (en az 2 karakter)"
            value={query}
          />
          <div aria-live="polite" className="mt-1 text-xs text-zinc-400">
            {query.trim().length < 2
              ? "Aramak için en az 2 karakter yazın."
              : searching
                ? "Aranıyor..."
                : `${results.length} sonuç`}
          </div>

          {query.trim().length >= 2 && results.length > 0 ? (
            <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-zinc-200">
              {results.map((product) => {
                const alreadySelected = selectedProductIds.has(product.id);
                return (
                  <li
                    className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-2 last:border-b-0"
                    key={product.id}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-800">
                        {product.name}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                        {product.code}
                      </span>
                    </span>
                    <button
                      className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={alreadySelected}
                      onClick={() => addProduct(product)}
                      type="button"
                    >
                      {alreadySelected ? "Eklendi" : "Ekle"}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Seçili ürünler
          </p>
          {selectedProducts.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500">
              Henüz manuel ürün eklenmedi.
            </p>
          ) : (
            <ol className="mt-2 space-y-2">
              {selectedProducts.map((product, index) => (
                <li
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2"
                  key={product.id}
                >
                  <span className="w-6 shrink-0 font-mono text-[11px] text-zinc-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-800">
                      {product.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                      {product.code}
                    </span>
                  </span>
                  <SmallButton
                    disabled={index === 0}
                    label="Yukarı taşı"
                    onClick={() => moveProduct(index, -1)}
                  >
                    ↑
                  </SmallButton>
                  <SmallButton
                    disabled={index === selectedProducts.length - 1}
                    label="Aşağı taşı"
                    onClick={() => moveProduct(index, 1)}
                  >
                    ↓
                  </SmallButton>
                  <button
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    onClick={() => removeProduct(product.id)}
                    type="button"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-zinc-800">Kategori ürünleri</h3>
          <p className="text-xs text-zinc-400">
            {selectedCategoryIds.size} kategori seçili
          </p>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Seçilen kategorilerdeki ürünler manuel listenin ardından eklenir. Alt
          kategoriler yalnızca yukarıdaki seçenek açıksa dahil edilir.
        </p>

        <ul className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-zinc-200">
          {categories.map((category) => (
            <li
              className="border-b border-zinc-100 last:border-b-0"
              key={category.id}
            >
              <label
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                style={{
                  paddingLeft: `${12 + categoryDepth(category, categoryById) * 18}px`,
                }}
              >
                <input
                  checked={selectedCategoryIds.has(category.id)}
                  className="h-4 w-4 accent-orange-600"
                  onChange={() => toggleCategory(category.id)}
                  type="checkbox"
                />
                <span>{category.name}</span>
                {category.active === 0 ? (
                  <span className="text-xs text-zinc-400">(pasif)</span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600">{state.message}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <Link
          className="text-sm font-semibold text-zinc-500 transition hover:text-zinc-800"
          href="/admin/koleksiyonlar"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
