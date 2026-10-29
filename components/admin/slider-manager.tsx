"use client";

import {
  useActionState,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  deleteSliderAction,
  reorderSlidesAction,
  saveSliderAction,
  toggleSliderActiveAction,
} from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";
import type { SliderItem } from "@/lib/types";

type OptimisticAction =
  | { type: "reorder"; ids: number[] }
  | { type: "toggle"; id: number; active: boolean };

function reduceSlides(
  state: SliderItem[],
  action: OptimisticAction
): SliderItem[] {
  if (action.type === "toggle") {
    return state.map((slide) =>
      slide.id === action.id
        ? { ...slide, active: action.active ? 1 : 0 }
        : slide
    );
  }

  const byId = new Map(state.map((slide) => [slide.id, slide]));
  const ordered = action.ids
    .map((id) => byId.get(id))
    .filter((slide): slide is SliderItem => Boolean(slide));
  const remaining = state.filter((slide) => !action.ids.includes(slide.id));
  return [...ordered, ...remaining];
}

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
      aria-label={active ? "Slaytı pasif yap" : "Slaytı aktif yap"}
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

function NewSlideFields() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="new-image">
            Görsel *
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Seçilen görsel önizlemesi"
                className="h-16 w-24 rounded-lg border border-zinc-200 object-cover"
                src={preview}
              />
            ) : null}
            <input
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="block w-full max-w-sm text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
              id="new-image"
              name="image"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
              required
              type="file"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            JPEG, PNG, WEBP, GIF veya AVIF • en fazla 5 MB
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="new-title">
            Başlık
          </label>
          <input className={inputClass} id="new-title" name="title" />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-subtitle">
            Alt başlık
          </label>
          <input className={inputClass} id="new-subtitle" name="subtitle" />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-link">
            Bağlantı
          </label>
          <input
            className={inputClass}
            id="new-link"
            name="link"
            placeholder="/kategori/... veya https://..."
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-zinc-700">
            <input
              className="h-4 w-4 accent-orange-600"
              defaultChecked
              name="active"
              type="checkbox"
            />
            Aktif
          </label>
        </div>
      </div>
    </>
  );
}

function NewSlideForm() {
  const [state, formAction, pending] = useActionState(saveSliderAction, {});

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5"
    >
      <p className="text-sm font-bold text-zinc-800">Yeni Slider Ekle</p>
      <NewSlideFields key={state.nonce ?? "new"} />

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
        {pending ? "Yükleniyor..." : "Slider Ekle"}
      </button>
    </form>
  );
}

function EditSlideForm({ slide }: { slide: SliderItem }) {
  const [state, formAction, pending] = useActionState(saveSliderAction, {});
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form
      action={formAction}
      className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2"
    >
      <input name="sliderId" type="hidden" value={slide.id} />
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`image-${slide.id}`}>
          Görsel değiştir
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={slide.title ?? "Slider görseli"}
            className="h-16 w-24 rounded-lg border border-zinc-200 object-cover"
            src={preview ?? slide.image_url}
          />
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block w-full max-w-sm text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
            id={`image-${slide.id}`}
            name="image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            type="file"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Boş bırakılırsa mevcut görsel korunur.
        </p>
      </div>
      <div>
        <label className={labelClass}>Başlık</label>
        <input
          className={inputClass}
          defaultValue={slide.title ?? ""}
          name="title"
        />
      </div>
      <div>
        <label className={labelClass}>Alt başlık</label>
        <input
          className={inputClass}
          defaultValue={slide.subtitle ?? ""}
          name="subtitle"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Bağlantı</label>
        <input
          className={inputClass}
          defaultValue={slide.link ?? ""}
          name="link"
        />
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-red-600 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600 sm:col-span-2">
          {state.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

export function SliderManager({ slides }: { slides: SliderItem[] }) {
  const [optimisticSlides, applyOptimistic] = useOptimistic(
    slides,
    reduceSlides
  );
  const [isPending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  function persistOrder(ids: number[]) {
    startTransition(async () => {
      applyOptimistic({ type: "reorder", ids });
      await reorderSlidesAction(ids);
    });
  }

  function move(slideId: number, direction: -1 | 1) {
    const ids = optimisticSlides.map((slide) => slide.id);
    const index = ids.indexOf(slideId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persistOrder(ids);
  }

  function dropOn(targetId: number) {
    setDragOverId(null);
    if (dragId === null || dragId === targetId) return;

    const ids = optimisticSlides.map((slide) => slide.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);
    persistOrder(ids);
  }

  function toggle(slide: SliderItem) {
    const next = slide.active !== 1;
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id: slide.id, active: next });
      await toggleSliderActiveAction(slide.id, next);
    });
  }

  return (
    <div className="space-y-6">
      <NewSlideForm />

      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Sıralamayı değiştirmek için tutamaçtan sürükleyin veya ok
          butonlarını kullanın.
        </p>

        {optimisticSlides.map((slide, index) => (
          <div
            className={`rounded-2xl border bg-white transition ${
              dragOverId === slide.id
                ? "border-orange-400 ring-2 ring-orange-200"
                : "border-zinc-200"
            } ${dragId === slide.id ? "opacity-60" : ""}`}
            key={slide.id}
            onDragLeave={() =>
              setDragOverId((current) =>
                current === slide.id ? null : current
              )
            }
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverId(slide.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dropOn(slide.id);
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
                  event.dataTransfer.setData("text/plain", String(slide.id));
                  setDragId(slide.id);
                }}
                type="button"
              >
                <GripIcon />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={slide.title ?? "Slider görseli"}
                className={`h-14 w-20 shrink-0 rounded-lg border border-zinc-200 object-cover ${
                  slide.active === 1 ? "" : "grayscale"
                }`}
                src={slide.image_url}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {slide.title || `Slayt #${index + 1}`}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {slide.subtitle || slide.link || "Başlık ve bağlantı yok"}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="Yukarı taşı"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === 0 || isPending}
                  onClick={() => move(slide.id, -1)}
                  type="button"
                >
                  <ChevronIcon direction="up" />
                </button>
                <button
                  aria-label="Aşağı taşı"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === optimisticSlides.length - 1 || isPending}
                  onClick={() => move(slide.id, 1)}
                  type="button"
                >
                  <ChevronIcon direction="down" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ToggleSwitch
                  active={slide.active === 1}
                  disabled={isPending}
                  onToggle={() => toggle(slide)}
                />
                <span className="w-12 text-xs font-medium text-zinc-500">
                  {slide.active === 1 ? "Aktif" : "Pasif"}
                </span>
              </div>

              <button
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() =>
                  setEditingId((current) =>
                    current === slide.id ? null : slide.id
                  )
                }
                type="button"
              >
                {editingId === slide.id ? "Kapat" : "Düzenle"}
              </button>

              <form
                action={deleteSliderAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm("Bu slider silinsin mi? Bu işlem geri alınamaz.")
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input name="sliderId" type="hidden" value={slide.id} />
                <button
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  type="submit"
                >
                  Sil
                </button>
              </form>
            </div>

            {editingId === slide.id ? <EditSlideForm slide={slide} /> : null}
          </div>
        ))}

        {optimisticSlides.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            Henüz slider yok. Yukarıdaki formdan ilk görseli yükleyin.
          </p>
        ) : null}
      </div>
    </div>
  );
}
