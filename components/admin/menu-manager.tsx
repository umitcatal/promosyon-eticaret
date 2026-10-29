"use client";

import {
  useActionState,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  deleteMenuItemAction,
  reorderMenuItemsAction,
  saveMenuItemAction,
  toggleMenuItemActiveAction,
} from "@/app/actions/content";
import type { AdminActionState } from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";
import type { MenuItem, MenuItemType } from "@/lib/types";

export type MenuManagerItem = MenuItem & {
  page_title: string | null;
  page_slug: string | null;
};

export type MenuPageOption = {
  id: number;
  title: string;
  slug: string;
  active: number;
};

type OptimisticAction =
  | { type: "reorder"; ids: number[] }
  | { type: "toggle"; id: number; active: boolean };

function reduceItems(
  state: MenuManagerItem[],
  action: OptimisticAction
): MenuManagerItem[] {
  if (action.type === "toggle") {
    return state.map((item) =>
      item.id === action.id
        ? { ...item, active: action.active ? 1 : 0 }
        : item
    );
  }

  const byId = new Map(state.map((item) => [item.id, item]));
  const ordered = action.ids
    .map((id) => byId.get(id))
    .filter((item): item is MenuManagerItem => Boolean(item));
  const remaining = state.filter((item) => !action.ids.includes(item.id));
  return [...ordered, ...remaining];
}

const TYPE_LABELS: Record<MenuItemType, string> = {
  link: "Bağlantı",
  page: "Sayfa",
  categories: "Kategoriler",
};

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <circle cx="5" cy="4" r="1.4" />
      <circle cx="11" cy="4" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="11" cy="12" r="1.4" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "up" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToggleSwitch({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-checked={active}
      aria-label={active ? "Menü öğesini pasif yap" : "Menü öğesini aktif yap"}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        active ? "bg-orange-600" : "bg-zinc-300"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function MenuFields({
  item,
  pages,
}: {
  item?: MenuManagerItem;
  pages: MenuPageOption[];
}) {
  const [type, setType] = useState<MenuItemType>(item?.type ?? "link");

  return (
    <>
      {item ? (
        <input name="menuItemId" type="hidden" value={item.id} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Etiket *</label>
          <input
            className={inputClass}
            defaultValue={item?.label ?? ""}
            name="label"
            placeholder="Örn. Hakkımızda"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Tür</label>
          <select
            className={inputClass}
            name="type"
            onChange={(event) => setType(event.target.value as MenuItemType)}
            value={type}
          >
            <option value="link">Bağlantı (kod rotası / URL)</option>
            <option value="page">Sayfa (oluşturulan içerik)</option>
            <option value="categories">Kategoriler (mega menü)</option>
          </select>
        </div>

        {type === "link" ? (
          <div className="sm:col-span-2">
            <label className={labelClass}>Adres *</label>
            <input
              className={inputClass}
              defaultValue={item?.href ?? ""}
              name="href"
              placeholder="/hakkimizda, /iletisim veya https://..."
            />
            <p className="mt-1 text-xs text-zinc-400">
              Kod tarafında bir route varsa buraya yazın (örn. /hakkimizda).
              Yoksa aşağıdaki &quot;Sayfa&quot; türünü kullanın.
            </p>
          </div>
        ) : null}

        {type === "page" ? (
          <div className="sm:col-span-2">
            <label className={labelClass}>Sayfa *</label>
            <select
              className={inputClass}
              defaultValue={item?.page_id ?? ""}
              name="pageId"
            >
              <option value="">Sayfa seçin</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title} (/{page.slug})
                  {page.active === 1 ? "" : " - taslak"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">
              <a
                className="font-semibold text-orange-600 hover:text-orange-700"
                href="/admin/sayfalar/yeni?donus=%2Fadmin%2Fmenu"
                rel="noopener noreferrer"
                target="_blank"
              >
                Yeni sayfa oluştur
              </a>{" "}
              (yeni sekmede açılır; oluşturduktan sonra bu sayfayı yenileyin).
            </p>
          </div>
        ) : null}

        {type === "categories" ? (
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800 sm:col-span-2">
            Tüm üst kategoriler ve alt kategoriler mega menü olarak gösterilir.
            Başlığa tıklandığında <strong>/urunler</strong> sayfası açılır.
          </div>
        ) : null}

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={item ? item.active === 1 : true}
            name="active"
            type="checkbox"
          />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={item?.open_in_new_tab === 1}
            name="openInNewTab"
            type="checkbox"
          />
          Yeni sekmede aç
        </label>
      </div>
    </>
  );
}

function NewMenuItemForm({ pages }: { pages: MenuPageOption[] }) {
  const [state, formAction, pending] = useActionState(
    saveMenuItemAction,
    {} as AdminActionState
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5"
    >
      <p className="text-sm font-bold text-zinc-800">Yeni Menü Öğesi</p>
      <MenuFields key={state.nonce ?? "new"} pages={pages} />

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600">{state.message}</p>
      ) : null}

      <button
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Menü Öğesi Ekle"}
      </button>
    </form>
  );
}

function EditMenuItemForm({
  item,
  pages,
}: {
  item: MenuManagerItem;
  pages: MenuPageOption[];
}) {
  const [state, formAction, pending] = useActionState(
    saveMenuItemAction,
    {} as AdminActionState
  );

  return (
    <form
      action={formAction}
      className="space-y-4 border-t border-zinc-200 p-4"
    >
      <MenuFields item={item} pages={pages} />

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600">{state.message}</p>
      ) : null}

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

export function MenuManager({
  items,
  pages,
}: {
  items: MenuManagerItem[];
  pages: MenuPageOption[];
}) {
  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    reduceItems
  );
  const [isPending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  function persistOrder(ids: number[]) {
    startTransition(async () => {
      applyOptimistic({ type: "reorder", ids });
      await reorderMenuItemsAction(ids);
    });
  }

  function move(itemId: number, direction: -1 | 1) {
    const ids = optimisticItems.map((item) => item.id);
    const index = ids.indexOf(itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persistOrder(ids);
  }

  function dropOn(targetId: number) {
    setDragOverId(null);
    if (dragId === null || dragId === targetId) return;

    const ids = optimisticItems.map((item) => item.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);
    persistOrder(ids);
  }

  function toggle(item: MenuManagerItem) {
    const next = item.active !== 1;
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id: item.id, active: next });
      await toggleMenuItemActiveAction(item.id, next);
    });
  }

  return (
    <div className="space-y-6">
      <NewMenuItemForm pages={pages} />

      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Sıralamayı değiştirmek için tutamaçtan sürükleyin veya ok
          butonlarını kullanın. Menüde en üstte olan öğe sitede ilk sırada
          görünür.
        </p>

        {optimisticItems.map((item, index) => (
          <div
            className={`rounded-2xl border bg-white transition ${
              dragOverId === item.id
                ? "border-orange-400 ring-2 ring-orange-200"
                : "border-zinc-200"
            } ${dragId === item.id ? "opacity-60" : ""}`}
            key={item.id}
            onDragLeave={() =>
              setDragOverId((current) =>
                current === item.id ? null : current
              )
            }
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverId(item.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dropOn(item.id);
            }}
          >
            <div className="flex flex-wrap items-center gap-3 p-4">
              <button
                aria-label="Sürükleyerek sırala"
                className="cursor-grab rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing"
                draggable
                onDragEnd={() => {
                  setDragId(null);
                  setDragOverId(null);
                }}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(item.id));
                  setDragId(item.id);
                }}
                type="button"
              >
                <GripIcon />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {item.label}
                  </p>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {TYPE_LABELS[item.type]}
                  </span>
                  {item.open_in_new_tab === 1 ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                      Yeni sekme
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-zinc-500">
                  {item.type === "page"
                    ? item.page_title
                      ? `${item.page_title} (${item.page_slug ? `/${item.page_slug}` : ""})`
                      : "Sayfa seçilmedi"
                    : item.type === "categories"
                      ? "/urunler • mega menü"
                      : item.href}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="Yukarı taşı"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === 0 || isPending}
                  onClick={() => move(item.id, -1)}
                  type="button"
                >
                  <ChevronIcon direction="up" />
                </button>
                <button
                  aria-label="Aşağı taşı"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === optimisticItems.length - 1 || isPending}
                  onClick={() => move(item.id, 1)}
                  type="button"
                >
                  <ChevronIcon direction="down" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ToggleSwitch
                  active={item.active === 1}
                  disabled={isPending}
                  onToggle={() => toggle(item)}
                />
                <span className="w-12 text-xs font-medium text-zinc-500">
                  {item.active === 1 ? "Aktif" : "Pasif"}
                </span>
              </div>

              <button
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() =>
                  setEditingId((current) =>
                    current === item.id ? null : item.id
                  )
                }
                type="button"
              >
                {editingId === item.id ? "Kapat" : "Düzenle"}
              </button>

              <form
                action={deleteMenuItemAction}
                onSubmit={(event) => {
                  if (!window.confirm("Bu menü öğesi silinsin mi?")) {
                    event.preventDefault();
                  }
                }}
              >
                <input name="menuItemId" type="hidden" value={item.id} />
                <button
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  type="submit"
                >
                  Sil
                </button>
              </form>
            </div>

            {editingId === item.id ? (
              <EditMenuItemForm item={item} pages={pages} />
            ) : null}
          </div>
        ))}

        {optimisticItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            Henüz menü öğesi yok. Menü boşken sitede varsayılan
            &quot;Ürünler&quot; mega menüsü gösterilir.
          </p>
        ) : null}
      </div>
    </div>
  );
}
