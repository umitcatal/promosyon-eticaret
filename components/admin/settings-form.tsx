"use client";

import { useActionState } from "react";
import {
  saveSettingsAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";

const initialState: AdminActionState = {};

export function SettingsForm({ priceXmlUrl }: { priceXmlUrl: string }) {
  const [state, action, pending] = useActionState(
    saveSettingsAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="priceXmlUrl">
          Fiyat XML/API adresi
        </label>
        <input
          className={inputClass}
          defaultValue={priceXmlUrl}
          id="priceXmlUrl"
          name="priceXmlUrl"
          placeholder="https://.../fiyat.xml"
          type="url"
        />
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Adres tanımlandığında &quot;Fiyatları XML&apos;den Güncelle&quot;
          butonu bu kaynaktan fiyat çeker. Kaynak formatı netleşince eşleme
          adaptörü tamamlanacaktır.
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
