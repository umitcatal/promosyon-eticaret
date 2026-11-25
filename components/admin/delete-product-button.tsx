"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { deleteProductAction } from "@/app/actions/products";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Trash2 className="h-4 w-4" />
        Ürünü Sil
      </button>

      {open ? (
        <DeleteProductDialog
          onClose={() => setOpen(false)}
          productId={productId}
          productName={productName}
        />
      ) : null}
    </>
  );
}

function DeleteProductDialog({
  productId,
  productName,
  onClose,
}: {
  productId: number;
  productName: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Enter") return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select")) return;

      event.preventDefault();
      formRef.current?.requestSubmit();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/40 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-describedby="product-delete-description"
        aria-labelledby="product-delete-title"
        aria-modal="true"
        className="my-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
        ref={panelRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </span>
            <div>
              <h2
                className="text-base font-bold text-zinc-900"
                id="product-delete-title"
              >
                Ürünü silmek istiyor musunuz?
              </h2>
              <p className="mt-1 text-sm font-medium text-zinc-700">
                {productName}
              </p>
            </div>
          </div>
          <button
            aria-label="Kapat"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <p
          className="text-sm leading-6 text-zinc-600"
          id="product-delete-description"
        >
          Ürün siteden kaldırılır ve katalogdan gizlenir. Veriler güvenle
          saklanır; ürünü daha sonra{" "}
          <span className="font-semibold text-zinc-800">
            Silinen Ürünler
          </span>{" "}
          alanından geri alabilirsiniz.
        </p>

        <form action={deleteProductAction} ref={formRef}>
          <input name="productId" type="hidden" value={productId} />

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <button
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              onClick={onClose}
              type="button"
            >
              Vazgeç
            </button>
            <ConfirmDeleteButton />
          </div>
        </form>

        <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-sans font-semibold text-zinc-600">
            Enter
          </kbd>{" "}
          ile onayla ·{" "}
          <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1.5 py-0.5 font-sans font-semibold text-zinc-600">
            Esc
          </kbd>{" "}
          ile iptal et
        </p>
      </div>
    </div>
  );
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Trash2 className="h-4 w-4" />
      {pending ? "Siliniyor..." : "Evet, Ürünü Sil"}
    </button>
  );
}
