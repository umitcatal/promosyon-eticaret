"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import {
  addReferencesMenuLinkAction,
  createClientReferencesAction,
  deleteClientReferenceAction,
  reorderClientReferencesAction,
  toggleClientReferenceActiveAction,
  updateClientReferenceAction,
} from "@/app/actions/references";
import { inputClass, labelClass } from "@/components/ui/styles";
import type { ClientReference } from "@/lib/types";

type OptimisticAction =
  | { type: "reorder"; ids: number[] }
  | { type: "toggle"; id: number; active: boolean };

function reduceReferences(
  state: ClientReference[],
  action: OptimisticAction
): ClientReference[] {
  if (action.type === "toggle") {
    return state.map((reference) =>
      reference.id === action.id
        ? { ...reference, active: action.active ? 1 : 0 }
        : reference
    );
  }

  const byId = new Map(state.map((reference) => [reference.id, reference]));
  const ordered = action.ids
    .map((id) => byId.get(id))
    .filter((reference): reference is ClientReference => Boolean(reference));
  const remaining = state.filter(
    (reference) => !action.ids.includes(reference.id)
  );
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
      aria-label={active ? "Referansı pasif yap" : "Referansı aktif yap"}
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

function NewReferenceFields() {
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const urlsRef = useRef<string[]>([]);

  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  return (
    <>
      <div>
        <label className={labelClass} htmlFor="reference-images">
          Görseller *
        </label>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
          id="reference-images"
          multiple
          name="images"
          onChange={(event) => {
            urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            const files = Array.from(event.target.files ?? []);
            const urls = files.map((file) => URL.createObjectURL(file));
            urlsRef.current = urls;
            setPreviews(
              files.map((file, index) => ({
                url: urls[index],
                name: file.name,
              }))
            );
          }}
          required
          type="file"
        />
        <p className="mt-1 text-xs text-zinc-400">
          JPEG, PNG, WEBP, GIF veya AVIF • tek seferde en fazla 10 dosya • toplam
          6 MB • her dosya en fazla 5 MB. Şeffaf PNG en iyi sonucu verir.
        </p>
      </div>

      {previews.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((preview, index) => (
            <div
              className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3"
              key={`${preview.name}-${index}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`${preview.name} önizlemesi`}
                className="h-20 w-full rounded-lg border border-zinc-200 bg-white object-contain p-2"
                src={preview.url}
              />
              <input
                className={inputClass}
                name="names"
                placeholder={`${index + 1}. logo • şirket adı (opsiyonel)`}
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function NewReferencesForm() {
  const [state, formAction, pending] = useActionState(
    createClientReferencesAction,
    {}
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5"
    >
      <div>
        <p className="text-sm font-bold text-zinc-800">Logo Yükle</p>
        <p className="text-xs text-zinc-500">
          Birden fazla logo seçebilir, her logoya opsiyonel şirket adı
          girebilirsiniz. Logolar otomatik olarak listenin sonuna eklenir.
        </p>
      </div>

      <NewReferenceFields key={state.nonce ?? "new"} />

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
        {pending ? "Yükleniyor..." : "Logoları Yükle"}
      </button>
    </form>
  );
}

function EditReferenceForm({ reference }: { reference: ClientReference }) {
  const [state, formAction, pending] = useActionState(
    updateClientReferenceAction,
    {}
  );
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2"
    >
      <input name="referenceId" type="hidden" value={reference.id} />
      <div>
        <label className={labelClass} htmlFor={`reference-name-${reference.id}`}>
          Şirket adı
        </label>
        <input
          className={inputClass}
          defaultValue={reference.name ?? ""}
          id={`reference-name-${reference.id}`}
          name="name"
          placeholder="Boş bırakılabilir"
        />
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={reference.active === 1}
            name="active"
            type="checkbox"
          />
          Aktif
        </label>
      </div>
      <div className="sm:col-span-2">
        <label
          className={labelClass}
          htmlFor={`reference-image-${reference.id}`}
        >
          Logoyu değiştir
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={reference.name ?? "Referans logosu"}
            className="h-16 w-24 rounded-lg border border-zinc-200 bg-white object-contain p-1"
            src={preview ?? reference.image_url}
          />
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block w-full max-w-sm text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
            id={`reference-image-${reference.id}`}
            name="image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            type="file"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Boş bırakılırsa mevcut logo korunur.
        </p>
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

function MenuCard({
  hasMenuLink,
  menuEmpty,
}: {
  hasMenuLink: boolean;
  menuEmpty: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    addReferencesMenuLinkAction,
    {}
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-sm font-bold text-zinc-800">Menü Bağlantısı</p>
      <p className="mt-1 text-sm text-zinc-500">
        {hasMenuLink
          ? "Menüde “Referanslarımız” bağlantısı mevcut. Menü sırasını Menü ekranından değiştirebilirsiniz."
          : "Referanslar sayfasına menüden erişmek için bağlantıyı ekleyin."}
      </p>

      {hasMenuLink ? null : (
        <>
          {menuEmpty ? (
            <p className="mt-2 text-xs text-zinc-400">
              Menü boş olduğu için bağlantıyla birlikte “Ürünler” kataloğu da
              menüye eklenecek.
            </p>
          ) : null}
          <form action={formAction} className="mt-3">
            <button
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Ekleniyor..." : "Menüye “Referanslarımız” ekle"}
            </button>
          </form>
        </>
      )}

      {state.error ? (
        <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="mt-2 text-sm font-medium text-emerald-600">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function ReferencesManager({
  references,
  hasMenuLink,
  menuEmpty,
}: {
  references: ClientReference[];
  hasMenuLink: boolean;
  menuEmpty: boolean;
}) {
  const [optimisticReferences, applyOptimistic] = useOptimistic(
    references,
    reduceReferences
  );
  const [isPending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  function persistOrder(ids: number[]) {
    startTransition(async () => {
      applyOptimistic({ type: "reorder", ids });
      await reorderClientReferencesAction(ids);
    });
  }

  function move(referenceId: number, direction: -1 | 1) {
    const ids = optimisticReferences.map((reference) => reference.id);
    const index = ids.indexOf(referenceId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persistOrder(ids);
  }

  function dropOn(targetId: number) {
    setDragOverId(null);
    if (dragId === null || dragId === targetId) return;

    const ids = optimisticReferences.map((reference) => reference.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);
    persistOrder(ids);
  }

  function toggle(reference: ClientReference) {
    const next = reference.active !== 1;
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id: reference.id, active: next });
      await toggleClientReferenceActiveAction(reference.id, next);
    });
  }

  return (
    <div className="space-y-6">
      <MenuCard hasMenuLink={hasMenuLink} menuEmpty={menuEmpty} />

      <NewReferencesForm />

      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Sıralamayı değiştirmek için tutamaçtan sürükleyin veya ok butonlarını
          kullanın. Sıralama satırlara dağıtımı etkiler: logolar sırayla
          satırlara bölünür.
        </p>

        {optimisticReferences.map((reference, index) => (
          <div
            className={`rounded-2xl border bg-white transition ${
              dragOverId === reference.id
                ? "border-orange-400 ring-2 ring-orange-200"
                : "border-zinc-200"
            } ${dragId === reference.id ? "opacity-60" : ""}`}
            key={reference.id}
            onDragLeave={() =>
              setDragOverId((current) =>
                current === reference.id ? null : current
              )
            }
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverId(reference.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dropOn(reference.id);
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
                  event.dataTransfer.setData(
                    "text/plain",
                    String(reference.id)
                  );
                  setDragId(reference.id);
                }}
                type="button"
              >
                <GripIcon />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={reference.name ?? "Referans logosu"}
                className={`h-14 w-24 shrink-0 rounded-lg border border-zinc-200 bg-white object-contain p-1 ${
                  reference.active === 1 ? "" : "grayscale"
                }`}
                src={reference.image_url}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {reference.name ?? "İsimsiz referans"}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {`Sıra #${index + 1}`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="Yukarı taşı"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={index === 0 || isPending}
                  onClick={() => move(reference.id, -1)}
                  type="button"
                >
                  <ChevronIcon direction="up" />
                </button>
                <button
                  aria-label="Aşağı taşı"
                  className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={
                    index === optimisticReferences.length - 1 || isPending
                  }
                  onClick={() => move(reference.id, 1)}
                  type="button"
                >
                  <ChevronIcon direction="down" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ToggleSwitch
                  active={reference.active === 1}
                  disabled={isPending}
                  onToggle={() => toggle(reference)}
                />
                <span className="w-12 text-xs font-medium text-zinc-500">
                  {reference.active === 1 ? "Aktif" : "Pasif"}
                </span>
              </div>

              <button
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() =>
                  setEditingId((current) =>
                    current === reference.id ? null : reference.id
                  )
                }
                type="button"
              >
                {editingId === reference.id ? "Kapat" : "Düzenle"}
              </button>

              <form
                action={deleteClientReferenceAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      "Bu referans silinsin mi? Bu işlem geri alınamaz."
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input
                  name="referenceId"
                  type="hidden"
                  value={reference.id}
                />
                <button
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  type="submit"
                >
                  Sil
                </button>
              </form>
            </div>

            {editingId === reference.id ? (
              <EditReferenceForm reference={reference} />
            ) : null}
          </div>
        ))}

        {optimisticReferences.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            Henüz referans yok. Yukarıdaki formdan ilk logoları yükleyin; ana
            sayfa bölümü logo eklenene kadar görünmez.
          </p>
        ) : null}
      </div>
    </div>
  );
}

