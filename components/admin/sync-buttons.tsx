"use client";

import { useActionState } from "react";
import {
  syncCatalogAction,
  syncPricesAction,
  type AdminActionState,
} from "@/app/actions/admin";

const initialState: AdminActionState = {};

export function SyncCatalogButton() {
  const [state, action, pending] = useActionState(
    syncCatalogAction,
    initialState
  );

  return (
    <form action={action} className="space-y-2">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Güncelleniyor..." : "Ürünleri XML'den Güncelle"}
      </button>
      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}

export function SyncPricesButton() {
  const [state, action, pending] = useActionState(
    syncPricesAction,
    initialState
  );

  return (
    <form action={action} className="space-y-2">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Fiyatlar Güncelleniyor..." : "Fiyatları XML'den Güncelle"}
      </button>
      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
