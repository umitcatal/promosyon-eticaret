"use client";

import { useActionState } from "react";
import {
  saveVatRateAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";
import { VAT_RATES } from "@/lib/vat";

const initialState: AdminActionState = {};

export function VatRateForm({ vatRate }: { vatRate: number }) {
  const [state, action, pending] = useActionState(
    saveVatRateAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="vatRate">
          KDV Oranı
        </label>
        <select
          className={inputClass}
          defaultValue={String(vatRate)}
          id="vatRate"
          name="vatRate"
        >
          {VAT_RATES.map((rate) => (
            <option key={rate} value={String(rate)}>
              {rate === 0 ? "KDV Uygulanmasın (%0)" : `%${rate}`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Seçilen oran, sepette ürünlerin ara toplamına eklenerek KDV dahil
          toplam hesaplanır. Ürün fiyatları KDV hariç olarak saklanır.
        </p>
      </div>

      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <button
        className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
