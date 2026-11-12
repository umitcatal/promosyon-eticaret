"use client";

import { useActionState } from "react";
import {
  saveWhatsAppSettingsAction,
  type AdminActionState,
} from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";
import type { WhatsAppSupport } from "@/lib/whatsapp";

const initialState: AdminActionState = {};

export function WhatsAppSettingsForm({
  settings,
}: {
  settings: WhatsAppSupport;
}) {
  const [state, action, pending] = useActionState(
    saveWhatsAppSettingsAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4" key={state.nonce ?? "whatsapp"}>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          className="h-4 w-4 rounded border-zinc-300 accent-orange-600"
          defaultChecked={settings.enabled}
          name="whatsappEnabled"
          type="checkbox"
        />
        WhatsApp destek hattını sitede göster
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="whatsappNumber">
            WhatsApp Numarası
          </label>
          <input
            autoComplete="off"
            className={inputClass}
            defaultValue={settings.number}
            id="whatsappNumber"
            inputMode="tel"
            name="whatsappNumber"
            placeholder="905551234567"
            type="tel"
          />
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Ülke koduyla, boşluksuz yazın (ör. 905551234567). Müşteri mesajı
            gönderdiğinde WhatsApp Web bu numarayla açılır. 0555... veya 555...
            biçimleri otomatik olarak 90555... biçimine çevrilir.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="whatsappTitle">
            Sohbet Başlığı
          </label>
          <input
            className={inputClass}
            defaultValue={settings.title}
            id="whatsappTitle"
            name="whatsappTitle"
            placeholder="WhatsApp Destek"
            type="text"
          />
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Sohbet penceresinin üst kısmında görünen başlık. Boş bırakılırsa
            &quot;WhatsApp Destek&quot; kullanılır.
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="whatsappWelcome">
          Karşılama Mesajı
        </label>
        <textarea
          className={inputClass}
          defaultValue={settings.welcomeMessage}
          id="whatsappWelcome"
          name="whatsappWelcome"
          placeholder="Merhaba. Kurumsal Promo'ya hoş geldiniz. Size nasıl yardımcı olabilirim?"
          rows={3}
        />
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Ziyaretçi sohbet penceresini açtığında ilk mesaj olarak bu metin
          görünür. Boş bırakılırsa varsayılan karşılama mesajı kullanılır.
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
