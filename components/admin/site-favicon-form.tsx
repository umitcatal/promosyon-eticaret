"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  removeSiteFaviconAction,
  saveSiteFaviconAction,
  type SiteIdentityState,
} from "@/app/actions/site";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/styles";
import type { SiteFavicon } from "@/lib/site-settings";

const initialState: SiteIdentityState = {};

export function SiteFaviconForm({ favicon }: { favicon: SiteFavicon | null }) {
  const [state, action, pending] = useActionState(
    saveSiteFaviconAction,
    initialState
  );

  return (
    <div className="space-y-4">
      {favicon ? (
        <div className="flex items-center gap-3">
          <Image
            alt="Mevcut favicon"
            className="rounded-lg border border-zinc-200 bg-white"
            height={64}
            src={favicon.icon192}
            width={64}
          />
          <p className="text-xs text-zinc-500">
            Bu alan adı için özel favicon yüklü.
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Özel favicon yüklenmedi; varsayılan ikon kullanılıyor.
        </p>
      )}

      <form action={action} className="space-y-4">
        <div key={state.nonce ?? "favicon"}>
          <label className={labelClass} htmlFor="favicon">
            Favicon görseli
          </label>
          <input
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className={inputClass}
            id="favicon"
            name="favicon"
            type="file"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Kare (1:1) PNG önerilir &bull; en az 512&times;512 piksel &bull; en
            fazla 5 MB. 32, 180, 192 ve 512 piksel boyutları otomatik üretilir.
          </p>
        </div>

        {state.error ? (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        ) : null}
        {state.ok && state.message ? (
          <p className="text-sm font-medium text-emerald-600">{state.message}</p>
        ) : null}

        <button className={primaryButtonClass} disabled={pending} type="submit">
          {pending ? "Yükleniyor..." : "Favicon Yükle"}
        </button>
      </form>

      {favicon ? (
        <form action={removeSiteFaviconAction}>
          <button className={secondaryButtonClass} type="submit">
            Faviconu Kaldır
          </button>
        </form>
      ) : null}
    </div>
  );
}
