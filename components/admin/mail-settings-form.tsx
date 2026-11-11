"use client";

import { useActionState } from "react";
import {
  saveMailSettingsAction,
  sendTestMailAction,
  type AdminActionState,
} from "@/app/actions/admin";
import type { MailSettingsPublic } from "@/lib/mail";
import { inputClass, labelClass } from "@/components/ui/styles";

const initialState: AdminActionState = {};

const saveButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60";

const testButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60";

function StateMessages({ state }: { state: AdminActionState }) {
  return (
    <>
      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
    </>
  );
}

export function MailSettingsForm({
  settings,
}: {
  settings: MailSettingsPublic | null;
}) {
  const [state, action, pending] = useActionState(
    saveMailSettingsAction,
    initialState
  );
  const [testState, testAction, testPending] = useActionState(
    sendTestMailAction,
    initialState
  );

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="recipients">
            Alıcı E-posta Adresleri
          </label>
          <textarea
            className={inputClass}
            defaultValue={settings?.recipients.join("\n") ?? ""}
            id="recipients"
            name="recipients"
            placeholder={"umit130@gmail.com\ninfo@kurumsalpromo.com"}
            rows={3}
          />
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Her satıra bir adres yazın (virgül veya noktalı virgülle de
            ayırabilirsiniz). Sipariş teklifi oluşturulduğunda sipariş formu bu
            adreslere gönderilir. Liste boşsa mail gönderilmez.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="host">
              SMTP Sunucusu
            </label>
            <input
              className={inputClass}
              defaultValue={settings?.host ?? ""}
              id="host"
              name="host"
              placeholder="smtp.gmail.com"
              type="text"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="port">
              Port
            </label>
            <input
              className={inputClass}
              defaultValue={settings?.port ?? ""}
              id="port"
              name="port"
              placeholder="465"
              type="number"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            className="h-4 w-4 rounded border-zinc-300 accent-orange-600"
            defaultChecked={settings?.secure ?? true}
            name="secure"
            type="checkbox"
          />
          SSL (implicit TLS) — port 465 için işaretli, port 587 için işaretsiz
          bırakın (STARTTLS otomatik kullanılır).
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="user">
              SMTP Kullanıcısı
            </label>
            <input
              autoComplete="off"
              className={inputClass}
              defaultValue={settings?.user ?? ""}
              id="user"
              name="user"
              placeholder="kurumsalpromo@gmail.com"
              type="text"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pass">
              SMTP Şifresi
            </label>
            <input
              autoComplete="new-password"
              className={inputClass}
              id="pass"
              name="pass"
              placeholder={
                settings?.hasPass
                  ? "Değiştirmek için yazın"
                  : "Gmail uygulama şifresi"
              }
              type="password"
            />
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {settings?.hasPass
                ? "Şifre kayıtlı. Boş bırakılırsa mevcut şifre korunur."
                : "Gmail için 16 haneli uygulama şifresini boşluksuz girin."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="fromName">
              Gönderici Adı
            </label>
            <input
              className={inputClass}
              defaultValue={settings?.fromName ?? ""}
              id="fromName"
              name="fromName"
              placeholder="Kurumsal Promo"
              type="text"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="fromAddress">
              Gönderici E-posta Adresi
            </label>
            <input
              className={inputClass}
              defaultValue={settings?.fromAddress ?? ""}
              id="fromAddress"
              name="fromAddress"
              placeholder="kurumsalpromo@gmail.com"
              type="email"
            />
          </div>
        </div>

        <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">
          Gmail kullanacaksanız: hesabınızda 2 Adımlı Doğrulama&apos;yı açın,
          Google Hesap → Güvenlik → Uygulama şifreleri bölümünden 16 haneli bir
          uygulama şifresi oluşturun (normal hesap şifresi çalışmaz). Sunucu:
          smtp.gmail.com, Port: 465, SSL işaretli.
        </p>

        <StateMessages state={state} />

        <button className={saveButtonClass} disabled={pending} type="submit">
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <form
        action={testAction}
        className="space-y-3 border-t border-zinc-100 pt-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className={labelClass} htmlFor="testTo">
              Test Maili
            </label>
            <input
              className={inputClass}
              id="testTo"
              name="testTo"
              placeholder="Boş bırakılırsa kayıtlı alıcılara gönderilir"
              type="email"
            />
          </div>
          <button
            className={testButtonClass}
            disabled={testPending}
            type="submit"
          >
            {testPending ? "Gönderiliyor..." : "Test Maili Gönder"}
          </button>
        </div>
        <p className="text-xs leading-5 text-zinc-500">
          Kaydedilmiş ayarlarla gönderilir; değişiklik yaptıysanız önce
          kaydedin.
        </p>
        <StateMessages state={testState} />
      </form>
    </div>
  );
}