"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  removeLogoAction,
  saveLogoAction,
  type AdminActionState,
} from "@/app/actions/admin";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/styles";

const initialState: AdminActionState = {};

export function LogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, action, pending] = useActionState(saveLogoAction, initialState);

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
          Henüz logo yüklenmedi; header ve footer&apos;de &quot;Promosyon
          Eticaret&quot; yazısı gösterilir.
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
