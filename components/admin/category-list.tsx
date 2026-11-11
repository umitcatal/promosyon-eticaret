"use client";

import { useActionState, useDeferredValue, useMemo, useState } from "react";
import { updateCategoryBulkAction } from "@/app/actions/admin";
import { CategoryCreateDialog } from "@/components/admin/category-create-dialog";
import {
  CategoryForm,
  type CategoryAdminRow,
  type CategoryOrderDraft,
} from "@/components/admin/category-form";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/styles";
import type { CategoryOption } from "@/lib/types";

type StatusFilter = "all" | "active" | "passive";
type ImageFilter = "all" | "missing" | "present";
type HomeFilter = "all" | "shown" | "hidden";

const TURKISH_FOLD: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function normalizeTr(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .split("")
    .map((ch) => TURKISH_FOLD[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasImage(row: CategoryAdminRow): boolean {
  return Boolean(row.image_url?.trim());
}

function ChipGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (next: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) {
  return (
    <div aria-label={label} className="flex flex-col gap-1" role="group">
      <span className={labelClass}>{label}</span>
      <div className="inline-flex items-center gap-0.5 self-start rounded-full border border-zinc-200 bg-white p-0.5">
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              option.value === value
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminCategoryList({ rows }: { rows: CategoryAdminRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [image, setImage] = useState<ImageFilter>("all");
  const [home, setHome] = useState<HomeFilter>("all");
  const [parent, setParent] = useState("all");
  const [drafts, setDrafts] = useState<Record<number, CategoryOrderDraft>>({});
  const [bulkState, bulkAction, bulkPending] = useActionState(
    updateCategoryBulkAction,
    {},
  );
  const deferredQuery = useDeferredValue(query);

  function updateDraft(
    category: CategoryAdminRow,
    patch: Partial<CategoryOrderDraft>,
  ) {
    setDrafts((prev) => {
      const current = prev[category.id] ?? {
        sortOrder: String(category.sort_order),
        showOnHome: category.show_on_home === 1,
      };
      const next = { ...current, ...patch };
      const dirty =
        (Number(next.sortOrder) || 0) !== category.sort_order ||
        next.showOnHome !== (category.show_on_home === 1);
      const copy = { ...prev };
      if (dirty) {
        copy[category.id] = next;
      } else {
        delete copy[category.id];
      }
      return copy;
    });
  }

  const dirtyDrafts = useMemo(() => {
    return Object.entries(drafts).flatMap(([key, draft]) => {
      const base = rows.find((row) => row.id === Number(key));
      if (!base) return [];
      const dirty =
        (Number(draft.sortOrder) || 0) !== base.sort_order ||
        draft.showOnHome !== (base.show_on_home === 1);
      return dirty ? [{ id: base.id, draft }] : [];
    });
  }, [drafts, rows]);

  const draftCount = dirtyDrafts.length;
  const bulkPayload = JSON.stringify(
    dirtyDrafts.map(({ id, draft }) => ({
      id,
      sortOrder: draft.sortOrder,
      showOnHome: draft.showOnHome,
    })),
  );

  const parentOptions = useMemo(
    () => rows.filter((row) => row.parent_id === null),
    [rows],
  );

  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
        active: row.active,
        sort_order: row.sort_order,
      })),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = normalizeTr(deferredQuery.trim());
    return rows.filter((row) => {
      if (status === "active" && row.active !== 1) return false;
      if (status === "passive" && row.active !== 0) return false;
      if (image === "missing" && hasImage(row)) return false;
      if (image === "present" && !hasImage(row)) return false;
      if (home === "shown" && row.show_on_home !== 1) return false;
      if (home === "hidden" && row.show_on_home === 1) return false;
      if (parent === "root" && row.parent_id !== null) return false;
      if (
        parent !== "all" &&
        parent !== "root" &&
        row.parent_id !== Number(parent)
      ) {
        return false;
      }
      if (!term) return true;
      return [row.name, row.slug, row.parent_name ?? ""]
        .map(normalizeTr)
        .some((needle) => needle.includes(term));
    });
  }, [deferredQuery, home, image, parent, rows, status]);

  const hasFilters =
    query !== "" ||
    status !== "all" ||
    image !== "all" ||
    home !== "all" ||
    parent !== "all";

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setImage("all");
    setHome("all");
    setParent("all");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Kategoriler</h2>
          <p className="text-sm text-zinc-500">
            Gösterilen {filtered.length} / {rows.length} kategori • Ana sayfadaki
            Ürün Grupları bölümünde gösterilecek kategorileri buradan seçin
          </p>
        </div>
        <CategoryCreateDialog categories={categoryOptions} />
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-56 flex-1">
            <label className={labelClass} htmlFor="category-filter-q">
              Ara
            </label>
            <input
              className={inputClass}
              id="category-filter-q"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kategori adı, slug veya üst kategori..."
              type="search"
              value={query}
            />
          </div>

          <ChipGroup
            label="Durum"
            onChange={setStatus}
            options={[
              { label: "Tümü", value: "all" },
              { label: "Aktif", value: "active" },
              { label: "Pasif", value: "passive" },
            ]}
            value={status}
          />

          <ChipGroup
            label="Görsel"
            onChange={setImage}
            options={[
              { label: "Tümü", value: "all" },
              { label: "Yok", value: "missing" },
              { label: "Var", value: "present" },
            ]}
            value={image}
          />

          <ChipGroup
            label="Ana sayfa"
            onChange={setHome}
            options={[
              { label: "Tümü", value: "all" },
              { label: "Gösterilen", value: "shown" },
              { label: "Gizli", value: "hidden" },
            ]}
            value={home}
          />

          <div className="min-w-48">
            <label className={labelClass} htmlFor="category-filter-parent">
              Üst kategori
            </label>
            <select
              className={inputClass}
              id="category-filter-parent"
              onChange={(event) => setParent(event.target.value)}
              value={parent}
            >
              <option value="all">Tümü</option>
              <option value="root">Kök kategoriler</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters ? (
          <button
            className={secondaryButtonClass}
            onClick={resetFilters}
            type="button"
          >
            Filtreleri temizle
          </button>
        ) : null}
      </div>

      <form
        action={bulkAction}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Toplu kaydet</p>
          <p className="text-xs text-zinc-500">
            Sıra ve ana sayfa görünürlüğü değişikliklerini tek seferde kaydedin.
          </p>
          {bulkState.error ? (
            <p className="mt-1 text-sm font-medium text-red-600">
              {bulkState.error}
            </p>
          ) : null}
          {bulkState.ok && bulkState.message ? (
            <p className="mt-1 text-sm font-medium text-emerald-600">
              {bulkState.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-500">
            {draftCount > 0 ? `${draftCount} kategori değişti` : "Değişiklik yok"}
          </span>
          <button
            className={`${primaryButtonClass} w-auto`}
            disabled={bulkPending || draftCount === 0}
            type="submit"
          >
            {bulkPending ? "Kaydediliyor..." : "Tümünü kaydet"}
          </button>
        </div>

        <input name="updates" type="hidden" value={bulkPayload} />
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-sm text-zinc-500">
          <p>Filtreye uyan kategori bulunmuyor.</p>
          <button
            className={`${secondaryButtonClass} mt-4`}
            onClick={resetFilters}
            type="button"
          >
            Filtreleri temizle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <CategoryForm
              category={row}
              draft={drafts[row.id]}
              key={row.id}
              onDraftChange={(patch) => updateDraft(row, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
