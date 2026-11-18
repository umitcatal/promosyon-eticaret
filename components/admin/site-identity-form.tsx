"use client";

import { useActionState } from "react";
import {
  saveSiteIdentityAction,
  type SiteIdentityState,
} from "@/app/actions/site";
import { inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import type { SiteIdentity } from "@/lib/site-settings";

const initialState: SiteIdentityState = {};

export function SiteIdentityForm({ identity }: { identity: SiteIdentity }) {
  const [state, action, pending] = useActionState(
    saveSiteIdentityAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="siteName">
          Site adı
        </label>
        <input
          className={inputClass}
          defaultValue={identity.siteName}
          id="siteName"
          name="siteName"
          required
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="seoTitle">
          SEO başlığı
        </label>
        <input
          className={inputClass}
          defaultValue={identity.seoTitle}
          id="seoTitle"
          name="seoTitle"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="seoDescription">
          SEO açıklaması
        </label>
        <textarea
          className={inputClass}
          defaultValue={identity.seoDescription}
          id="seoDescription"
          name="seoDescription"
          rows={3}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ogImageUrl">
          OG görsel adresi
        </label>
        <input
          className={inputClass}
          defaultValue={identity.ogImageUrl}
          id="ogImageUrl"
          name="ogImageUrl"
          placeholder="/logo-meta.jpg"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Paylaşım kartlarında kullanılır; boş bırakılırsa varsayılan görsel
          kullanılır.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600">{state.message}</p>
      ) : null}

      <button className={primaryButtonClass} disabled={pending} type="submit">
        {pending ? "Kaydediliyor..." : "Site Kimliğini Kaydet"}
      </button>
    </form>
  );
}
