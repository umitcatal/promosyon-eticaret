"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import {
  deleteCollectionAction,
  saveCollectionAction,
  toggleCollectionActiveAction,
} from "@/app/actions/collections";
import { inputClass, labelClass } from "@/components/ui/styles";
import type { CollectionSummary } from "@/lib/types";

function CreateCollectionForm() {
  const [state, formAction, pending] = useActionState(
    saveCollectionAction,
    {}
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5"
    >
      <input name="collectionId" type="hidden" value={0} />
      <input name="products" type="hidden" value="[]" />
      <input name="categoryIds" type="hidden" value="[]" />
      <p className="text-sm font-bold text-zinc-800">Yeni Koleksiyon</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="new-collection-name">
            Koleksiyon adı
          </label>
          <input
            className={inputClass}
            id="new-collection-name"
            name="name"
            placeholder="En ucuz ürünler"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-collection-slug">
            Adres (opsiyonel)
          </label>
          <input
            className={inputClass}
            id="new-collection-slug"
            name="slug"
            placeholder="Boş bırakılırsa addan üretilir"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          className="h-4 w-4 accent-orange-600"
          defaultChecked
          name="active"
          type="checkbox"
        />
        Aktif
      </label>

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <button
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Oluşturuluyor..." : "Koleksiyon Oluştur"}
      </button>
      <p className="text-xs text-zinc-400">
        Oluşturduktan sonra ürünleri ve kategorileri düzenleme ekranından
        ekleyebilirsiniz.
      </p>
    </form>
  );
}

function ToggleButton({
  collectionId,
  active,
}: {
  collectionId: number;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      }`}
      disabled={pending}
      onClick={() =>
        startTransition(() =>
          toggleCollectionActiveAction(collectionId, !active)
        )
      }
      type="button"
    >
      {active ? "Aktif" : "Pasif"}
    </button>
  );
}

export function CollectionManager({
  collections,
}: {
  collections: CollectionSummary[];
}) {
  return (
    <div className="space-y-6">
      <CreateCollectionForm />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Koleksiyon</th>
              <th className="px-4 py-3 font-semibold">Ürün</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 text-right font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-zinc-500"
                  colSpan={4}
                >
                  Henüz koleksiyon yok. Yukarıdan ilk koleksiyonu oluşturun.
                </td>
              </tr>
            ) : null}

            {collections.map((collection) => (
              <tr
                className="border-b border-zinc-100 last:border-b-0"
                key={collection.id}
              >
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold text-zinc-900 hover:text-orange-700"
                    href={`/admin/koleksiyonlar/${collection.id}`}
                  >
                    {collection.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-zinc-400">
                    /koleksiyon/{collection.slug}
                  </p>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {collection.manual_count} manuel
                  {collection.category_count > 0
                    ? ` · ${collection.category_count} kategori`
                    : ""}
                </td>
                <td className="px-4 py-3">
                  <ToggleButton
                    active={collection.active === 1}
                    collectionId={collection.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      href={`/admin/koleksiyonlar/${collection.id}`}
                    >
                      Düzenle
                    </Link>
                    <form
                      action={deleteCollectionAction}
                      onSubmit={(event) => {
                        if (
                          !window.confirm(
                            `"${collection.name}" koleksiyonu silinsin mi?`
                          )
                        ) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input
                        name="collectionId"
                        type="hidden"
                        value={collection.id}
                      />
                      <button
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        type="submit"
                      >
                        Sil
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
