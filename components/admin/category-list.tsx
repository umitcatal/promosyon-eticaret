"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  CategoryForm,
  type CategoryAdminRow,
} from "@/components/admin/category-form";
import {
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "@/components/ui/styles";

type StatusFilter = "all" | "active" | "passive";
type ImageFilter = "all" | "missing" | "present";

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
  const [parent, setParent] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const parentOptions = useMemo(
    () => rows.filter((row) => row.parent_id === null),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = normalizeTr(deferredQuery.trim());
    return rows.filter((row) => {
      if (status === "active" && row.active !== 1) return false;
      if (status === "passive" && row.active !== 0) return false;
      if (image === "missing" && hasImage(row)) return false;
      if (image === "present" && !hasImage(row)) return false;
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
  }, [deferredQuery, image, parent, rows, status]);

  const hasFilters =
    query !== "" || status !== "all" || image !== "all" || parent !== "all";

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setImage("all");
    setParent("all");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Kategoriler</h2>
        <p className="text-sm text-zinc-500">
          Gösterilen {filtered.length} / {rows.length} kategori • Ana sayfada
          gösterilecek kategori görselini buradan yükleyin
        </p>
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
            <CategoryForm category={row} key={row.id} />
          ))}
        </div>
      )}
    </div>
  );
}
