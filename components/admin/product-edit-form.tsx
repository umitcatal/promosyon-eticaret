"use client";

import { useActionState } from "react";
import {
  updateProductAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { inputClass } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";

const initialState: AdminActionState = {};

type VariantInput = {
  id: number;
  name: string;
  price: number | null;
  netPrice: number | null;
  discount: number | null;
  stock: number | null;
  is_hidden: number;
  active: number;
};

export function ProductEditForm({
  product,
  variants,
}: {
  product: {
    id: number;
    name: string;
    code: string;
    is_featured: number;
    is_hidden: number;
  };
  variants: VariantInput[];
}) {
  const [state, action, pending] = useActionState(
    updateProductAction,
    initialState
  );

  return (
    <form action={action} className="space-y-6">
      <input name="productId" type="hidden" value={product.id} />

      <div className="flex flex-wrap gap-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={product.is_featured === 1}
            name="isFeatured"
            type="checkbox"
          />
          Öne çıkan ürün
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={product.is_hidden === 1}
            name="isHidden"
            type="checkbox"
          />
          Sitede gizle
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Varyant</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 font-semibold">Fiyat (TL)</th>
              <th className="px-4 py-3 font-semibold">Gizli</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {variants.map((variant) => (
              <tr key={variant.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-800">{variant.name}</p>
                  <p className="text-xs text-zinc-400">#{variant.id}</p>
                </td>
                <td className="px-4 py-3">
                  {variant.active ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Aktif
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                      Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    className={`${inputClass} max-w-40`}
                    defaultValue={variant.price ?? ""}
                    min="0"
                    name={`price_${variant.id}`}
                    placeholder="Boş = teklif"
                    step="0.01"
                    type="number"
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Net: {formatPrice(variant.netPrice) ?? "—"}
                    {variant.discount !== null && variant.discount > 0
                      ? ` · %${Math.round(variant.discount * 100)} iskonto`
                      : ""}
                    {variant.stock !== null
                      ? ` · Stok: ${variant.stock.toLocaleString("tr-TR")}`
                      : ""}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <input
                    className="h-4 w-4 accent-orange-600"
                    defaultChecked={variant.is_hidden === 1}
                    name={`hidden_${variant.id}`}
                    type="checkbox"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <button
        className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}
