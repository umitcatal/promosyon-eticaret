"use client";

import { useActionState } from "react";
import {
  saveGoogleTagAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";

const initialState: AdminActionState = {};

export function GoogleTagForm({ googleTagId }: { googleTagId: string }) {
  const [state, action, pending] = useActionState(
    saveGoogleTagAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="googleTagId">
          Google Analytics / GTM kodu veya kimliği
        </label>
        <input
          autoComplete="off"
          className={inputClass}
          defaultValue={googleTagId}
          id="googleTagId"
          name="googleTagId"
          placeholder="GTM-P65FSNTV veya G-XXXXXXXXXX"
          spellCheck={false}
        />
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          GTM kimliği (GTM-...) girildiğinde Google Tag Manager, GA4 kimliği
          (G-...) girildiğinde Google Analytics 4 etiketi sitenin{" "}
          <code>&lt;head&gt;</code> bölümüne eklenir. Hazır script kodunu
          olduğu gibi yapıştırabilirsiniz; kimlik otomatik olarak ayıklanır.
          Alanı boş bırakıp kaydederseniz etiket kaldırılır.
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
