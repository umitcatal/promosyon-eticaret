"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createOrderAction,
  type OrderFormState,
} from "@/app/actions/orders";
import { errorTextClass } from "@/components/ui/styles";

const initialState: OrderFormState = {};

export function CheckoutForm({
  idempotencyKey,
  isAuthenticated,
}: {
  idempotencyKey: string;
  isAuthenticated: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createOrderAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div>
        <label
          className="mb-1 block text-sm font-medium text-zinc-700"
          htmlFor="note"
        >
          Sipariş notu (opsiyonel)
        </label>
        <textarea
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500"
          id="note"
          name="note"
          placeholder="Logo baskı, teslimat veya fatura notlarınız..."
          rows={3}
        />
      </div>
      {state.error ? <p className={errorTextClass}>{state.error}</p> : null}
      <button
        className="inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Sipariş oluşturuluyor..."
          : isAuthenticated
            ? "Siparişi Tamamla"
            : "Giriş Yap ve Siparişi Tamamla"}
      </button>
      {!isAuthenticated ? (
        <p className="text-xs leading-5 text-zinc-500">
          Siparişi tamamlamak için{" "}
          <Link
            className="font-semibold text-orange-600"
            href="/giris?next=%2Fsepet"
          >
            giriş yapın
          </Link>{" "}
          veya{" "}
          <Link
            className="font-semibold text-orange-600"
            href="/kayit?next=%2Fsepet"
          >
            üye olun
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}
