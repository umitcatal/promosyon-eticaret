"use client";

import { inputClass, labelClass } from "@/components/ui/styles";
import type { CategoryOption } from "@/lib/types";

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

export function CategorySelect({
  categories,
  defaultValue,
  emptyLabel = "Kategori yok",
  id = "product-category",
  label = "Kategori",
  name = "categoryId",
}: {
  categories: CategoryOption[];
  defaultValue?: number | null;
  emptyLabel?: string;
  id?: string;
  label?: string;
  name?: string;
}) {
  const byId = new Map(categories.map((category) => [category.id, category]));

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <select
        className={inputClass}
        defaultValue={defaultValue ?? ""}
        id={id}
        name={name}
      >
        <option value="">{emptyLabel}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {`${"— ".repeat(categoryDepth(category, byId))}${category.name}`}
            {category.active === 0 ? " (pasif)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
