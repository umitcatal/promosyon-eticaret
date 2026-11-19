"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  removeLogoAction,
  saveLogoAction,
  saveLogoWidthsAction,
  type AdminActionState,
} from "@/app/actions/admin";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/styles";

const initialState: AdminActionState = {};

type LogoFormProps = {
  logoUrl: string | null;
  headerWidth: number | null;
  footerWidth: number | null;
};

export function LogoForm({
  logoUrl,
  headerWidth,
  footerWidth,
}: LogoFormProps) {
  const [state, action, pending] = useActionState(saveLogoAction, initialState);
  const [widthState, widthAction, widthPending] = useActionState(
    saveLogoWidthsAction,
    initialState
  );

  return (
    <div className="space-y-4">
      {logoUrl ? (
        <div className="flex h-16 w-fit items-center justify-center rounded-lg border border-zinc-200 bg-white px-4">
          <Image
            alt="Mevcut logo"
            className="max-h-12 w-auto"
            height={64}
            src={logoUrl}
            width={300}
          />
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Henüz logo yüklenmedi; header ve footer&apos;de &quot;Kurumsal
          Promo&quot; yazısı gösterilir.
        </p>
      )}

      <form action={action} className="space-y-4">
        <div key={state.nonce ?? "logo"}>
          <label className={labelClass} htmlFor="logo">
            Logo görseli
          </label>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className={inputClass}
            id="logo"
            name="logo"
            type="file"
          />
          <p className="mt-1 text-xs text-zinc-400">
            JPEG, PNG, WEBP, GIF veya AVIF &bull; en fazla 5 MB &bull; önerilen:
            yatay format, şeffaf arka planlı PNG
          </p>
        </div>

        {state.error ? (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        ) : null}
        {state.ok && state.message ? (
          <p className="text-sm font-medium text-emerald-600">{state.message}</p>
        ) : null}

        <button className={primaryButtonClass} disabled={pending} type="submit">
          {pending ? "Yükleniyor..." : "Logo Yükle"}
        </button>
      </form>

      <form action={widthAction} className="space-y-4 border-t border-zinc-200 pt-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900">
            Görüntüleme genişliği
          </h4>
          <p className="mt-1 text-xs text-zinc-500">
            Header ve footer için ayrı logo genişliği belirleyin. Boş bırakılan
            alan varsayılan boyutu kullanır. Yalnızca yüklenen logo görseli
            etkilenir.
          </p>
        </div>

        <div
          key={widthState.nonce ?? "logo-widths"}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div>
            <label className={labelClass} htmlFor="headerWidth">
              Header genişliği (px)
            </label>
            <input
              className={inputClass}
              defaultValue={headerWidth ?? ""}
              id="headerWidth"
              max={600}
              min={40}
              name="headerWidth"
              placeholder="Varsayılan"
              step={1}
              type="number"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="footerWidth">
              Footer genişliği (px)
            </label>
            <input
              className={inputClass}
              defaultValue={footerWidth ?? ""}
              id="footerWidth"
              max={600}
              min={40}
              name="footerWidth"
              placeholder="Varsayılan"
              step={1}
              type="number"
            />
          </div>
        </div>

        {widthState.error ? (
          <p className="text-sm font-medium text-red-600">{widthState.error}</p>
        ) : null}
        {widthState.ok && widthState.message ? (
          <p className="text-sm font-medium text-emerald-600">
            {widthState.message}
          </p>
        ) : null}

        <button
          className={primaryButtonClass}
          disabled={widthPending}
          type="submit"
        >
          {widthPending ? "Kaydediliyor..." : "Genişlikleri Kaydet"}
        </button>
      </form>

      {logoUrl ? (
        <form action={removeLogoAction}>
          <button className={secondaryButtonClass} type="submit">
            Logoyu Kaldır
          </button>
        </form>
      ) : null}
    </div>
  );
}
