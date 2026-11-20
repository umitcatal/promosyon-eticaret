"use client";

import { useTransition } from "react";
import {
  deleteRedirectAction,
  toggleRedirectActiveAction,
} from "@/app/actions/redirects";

export function RedirectToggle({
  id,
  active,
}: {
  id: number;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      }`}
      disabled={pending}
      onClick={() =>
        startTransition(() => toggleRedirectActiveAction(id, !active))
      }
      type="button"
    >
      {active ? "Aktif" : "Pasif"}
    </button>
  );
}

export function RedirectDeleteForm({
  id,
  source,
}: {
  id: number;
  source: string;
}) {
  return (
    <form
      action={deleteRedirectAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `"${source}" kuralı kalıcı olarak silinsin mi?\n\nBu işlem geri alınamaz. Emin değilseniz kuralı silmek yerine pasife alın.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        type="submit"
      >
        Sil
      </button>
    </form>
  );
}
