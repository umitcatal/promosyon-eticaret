"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateCartItemAction } from "@/app/actions/cart";
import { clampQuantity, MAX_QUANTITY_DIGITS } from "@/lib/quantity";

export function CartQuantity({
  variantId,
  quantity,
}: {
  variantId: number;
  quantity: number;
}) {
  const [draft, setDraft] = useState(String(quantity));
  const current = useRef(quantity);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    current.current = quantity;
    setDraft(String(quantity));
  }, [quantity]);

  function apply(next: number) {
    const value = clampQuantity(next);
    setDraft(String(value));
    if (value === current.current) return;
    current.current = value;

    const formData = new FormData();
    formData.set("variantId", String(variantId));
    formData.set("quantity", String(value));
    startTransition(() => {
      void updateCartItemAction(formData);
    });
  }

  return (
    <div className="flex items-center rounded-lg border border-zinc-300">
      <button
        aria-label="Adet azalt"
        className="flex h-9 w-9 items-center justify-center text-zinc-600 transition hover:text-orange-600"
        onClick={() => apply(current.current - 1)}
        type="button"
      >
        −
      </button>
      <input
        aria-label="Adet"
        autoComplete="off"
        className="h-9 w-14 border-x border-zinc-200 bg-transparent text-center text-sm font-semibold text-zinc-900 outline-none focus:bg-zinc-50"
        inputMode="numeric"
        onBlur={(event) => apply(Number(event.target.value))}
        onChange={(event) =>
          setDraft(
            event.target.value.replace(/\D/g, "").slice(0, MAX_QUANTITY_DIGITS)
          )
        }
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          apply(Number(event.currentTarget.value));
        }}
        ref={inputRef}
        type="text"
        value={draft}
      />
      <button
        aria-label="Adet artır"
        className="flex h-9 w-9 items-center justify-center text-zinc-600 transition hover:text-orange-600"
        onClick={() => apply(current.current + 1)}
        type="button"
      >
        +
      </button>
    </div>
  );
}
