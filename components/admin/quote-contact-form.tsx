"use client";

import { useActionState } from "react";
import {
  saveQuoteContactAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";
import { QUOTE_PHONE_HOURS } from "@/lib/quote";
import type { QuoteContactSettings } from "@/lib/quote-contact";

const initialState: AdminActionState = {};

export function QuoteContactForm({
  settings,
}: {
  settings: QuoteContactSettings;
}) {
  const [state, action, pending] = useActionState(
    saveQuoteContactAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4" key={state.nonce ?? "quote"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="quotePhone">
            Teklif Telefonu
          </label>
          <input
            autoComplete="off"
            className={inputClass}
            defaultValue={settings.phone}
            id="quotePhone"
            inputMode="tel"
            name="quotePhone"
            placeholder="0212 123 45 67"
            type="tel"
          />
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Ürün detayındaki Telefon butonu bu numarayı arar; buton üzerinde{" "}
            {QUOTE_PHONE_HOURS} çalışma saatleri görünür. Boş bırakılırsa
            WhatsApp destek numarası kullanılır.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="quoteEmail">
            Teklif E-postası
          </label>
          <input
            autoComplete="off"
            className={inputClass}
            defaultValue={settings.email}
            id="quoteEmail"
            name="quoteEmail"
            placeholder="info@kurumsalpromo.com"
            type="email"
          />
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Mail Teklif İste butonu, ürün ve miktar bilgileri dolu bir e-posta
            taslağını bu adresle açar. Boş bırakılırsa sipariş
            bildirimlerindeki ilk alıcı adresi kullanılır.
          </p>
        </div>
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