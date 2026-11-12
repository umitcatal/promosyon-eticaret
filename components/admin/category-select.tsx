"use client";

import { useMemo, useState } from "react";
import Select, {
  components,
  type ClassNamesConfig,
  type ClearIndicatorProps,
  type DropdownIndicatorProps,
  type FilterOptionOption,
  type OptionProps,
  type SingleValueProps,
} from "react-select";
import { Check, ChevronDown, X } from "lucide-react";
import { labelClass } from "@/components/ui/styles";
import { foldTr } from "@/lib/search-fold";
import type { CategoryOption } from "@/lib/types";

type CategoryChoice = {
  value: string;
  label: string;
  parentPath: string;
  depth: number;
  inactive: boolean;
  search: string;
};

function buildChoices(
  categories: CategoryOption[],
  emptyLabel: string
): CategoryChoice[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  const empty: CategoryChoice = {
    value: "",
    label: emptyLabel,
    parentPath: "",
    depth: 0,
    inactive: false,
    search: foldTr(emptyLabel),
  };

  const rest = categories.map((category) => {
    const chain: string[] = [];
    let depth = 0;
    let current = category;
    while (current.parent_id !== null && depth < 10) {
      const parent = byId.get(current.parent_id);
      if (!parent) break;
      chain.unshift(parent.name);
      depth += 1;
      current = parent;
    }
    const parentPath = chain.join(" › ");
    return {
      value: String(category.id),
      label: category.name,
      parentPath,
      depth,
      inactive: category.active === 0,
      search: foldTr(`${parentPath} ${category.name}`),
    };
  });

  return [empty, ...rest];
}

function filterChoice(
  option: FilterOptionOption<CategoryChoice>,
  inputValue: string
) {
  const query = foldTr(inputValue.trim());
  if (!query) return true;
  return option.data.value !== "" && option.data.search.includes(query);
}

const selectClassNames: ClassNamesConfig<CategoryChoice, false> = {
  container: () => "relative w-full text-sm",
  control: (state) =>
    [
      "flex w-full items-center rounded-sm border bg-paper px-3 py-2 text-ink transition",
      state.isFocused || state.menuIsOpen
        ? "border-brand-500 ring-2 ring-brand-500/20"
        : "border-line-strong hover:border-ink/30",
    ].join(" "),
  valueContainer: () => "flex flex-1 items-center gap-1 overflow-hidden p-0",
  input: () => "m-0 border-0 bg-transparent p-0 text-sm text-ink outline-none",
  placeholder: () => "truncate text-ink-muted/60",
  singleValue: () =>
    "m-0 flex items-center gap-1 overflow-hidden p-0 text-sm text-ink",
  indicatorsContainer: () => "flex shrink-0 items-center gap-0.5 pl-2",
  clearIndicator: () =>
    "cursor-pointer rounded-sm p-0.5 text-ink-muted transition hover:bg-surface hover:text-ink",
  dropdownIndicator: () => "cursor-pointer p-0.5 text-ink-muted",
  indicatorSeparator: () => "hidden",
  menu: () =>
    "overflow-hidden rounded-sm border border-line bg-sheet shadow-[0_12px_32px_-12px_rgba(20,19,15,0.35)]",
  menuList: () => "search-scroll max-h-72 overflow-y-auto py-1",
  option: (state) =>
    [
      "cursor-pointer px-3 py-2 text-sm transition-colors",
      state.isSelected
        ? "bg-brand-600 text-white"
        : state.isFocused
          ? "bg-brand-50 text-brand-800"
          : "text-ink",
    ].join(" "),
  noOptionsMessage: () => "px-3 py-6 text-center text-sm text-ink-muted",
};

function ChoiceOption(props: OptionProps<CategoryChoice, false>) {
  const { data, isSelected } = props;
  return (
    <components.Option {...props}>
      <span
        className="flex items-center gap-2"
        style={{ paddingLeft: `${data.depth * 0.75}rem` }}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {isSelected ? <Check size={14} strokeWidth={3} /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="break-words font-medium">
            {data.label}
            {data.inactive ? (
              <span className="text-xs opacity-70"> (pasif)</span>
            ) : null}
          </span>
          {data.parentPath ? (
            <span className="truncate text-xs opacity-60">
              {data.parentPath}
            </span>
          ) : null}
        </span>
      </span>
    </components.Option>
  );
}

function ChoiceValue(props: SingleValueProps<CategoryChoice, false>) {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <span
        className="truncate font-medium"
        title={[data.parentPath, data.label].filter(Boolean).join(" › ")}
      >
        {data.label}
        {data.inactive ? " (pasif)" : ""}
      </span>
    </components.SingleValue>
  );
}

function ChoiceDropdownIndicator(
  props: DropdownIndicatorProps<CategoryChoice, false>
) {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown size={16} />
    </components.DropdownIndicator>
  );
}

function ChoiceClearIndicator(props: ClearIndicatorProps<CategoryChoice, false>) {
  return (
    <components.ClearIndicator {...props}>
      <X size={14} />
    </components.ClearIndicator>
  );
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
  const choices = useMemo(
    () => buildChoices(categories, emptyLabel),
    [categories, emptyLabel]
  );
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [portalTarget] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body
  );

  const initial =
    defaultValue != null
      ? (choices.find((choice) => choice.value === String(defaultValue)) ?? null)
      : null;

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <Select<CategoryChoice, false>
        classNames={selectClassNames}
        components={{
          Option: ChoiceOption,
          SingleValue: ChoiceValue,
          DropdownIndicator: ChoiceDropdownIndicator,
          ClearIndicator: ChoiceClearIndicator,
        }}
        defaultValue={initial}
        filterOption={filterChoice}
        inputId={id}
        instanceId={id}
        isClearable
        isSearchable
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuIsOpen) {
            event.stopPropagation();
            // Next.js delegates React events to the same document as the modal listener.
            event.nativeEvent.stopImmediatePropagation();
          }
        }}
        menuPlacement="auto"
        menuPosition="fixed"
        menuPortalTarget={portalTarget}
        menuShouldScrollIntoView={false}
        name={name}
        noOptionsMessage={() => "Eşleşen kategori bulunamadı"}
        options={choices}
        placeholder={`${emptyLabel} — aramak için yazın`}
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
        unstyled
      />
    </div>
  );
}
