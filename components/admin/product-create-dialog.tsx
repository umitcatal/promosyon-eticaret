"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  createProductAction,
  deleteProductImageAction,
  type ProductActionState,
} from "@/app/actions/products";
import { CategorySelect } from "@/components/admin/category-select";
import {
  createVariantDraft,
  VariantEditor,
  type VariantDraft,
} from "@/components/admin/variant-editor";
import { inputClass, labelClass } from "@/components/ui/styles";
import { parseImageUrlList } from "@/lib/image-urls";
import type { CategoryOption } from "@/lib/types";

const initialState: ProductActionState = {};

type CreatedProduct = NonNullable<ProductActionState["created"]>;

export function ProductCreateDialog({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

  return (
    <>
      <button
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        onClick={() => {
          setSession((value) => value + 1);
          setOpen(true);
        }}
        type="button"
      >
        Yeni Ürün Ekle
      </button>

      {open ? (
        <ProductCreateSession
          categories={categories}
          key={session}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ProductCreateSession({
  categories,
  onClose,
}: {
  categories: CategoryOption[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    initialState
  );
  const [created, setCreated] = useState<CreatedProduct[]>([]);
  const [uploading, setUploading] = useState(0);
  const pendingUploads = useRef(new Set<string>());
  const lastNonce = useRef<string | undefined>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const uploads = pendingUploads.current;
    return () => {
      const urls = [...uploads];
      uploads.clear();
      for (const url of urls) void deleteProductImageAction(url);
    };
  }, []);

  useEffect(() => {
    if (!state.nonce || state.nonce === lastNonce.current) return;
    lastNonce.current = state.nonce;
    const product = state.created;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- action sonucu yalnızca effect'te görülebilir
    if (product) setCreated((previous) => [...previous, product]);

    const urls = [...pendingUploads.current];
    pendingUploads.current.clear();
    for (const url of urls) void deleteProductImageAction(url);
  }, [state]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/40 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="product-create-title"
        aria-modal="true"
        className="my-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-xl"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-base font-bold text-zinc-900"
              id="product-create-title"
            >
              Yeni Ürün Ekle
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Kaydedilen ürün XML beslemesinden etkilenmez; modal açık kalır ve
              form yeni ürün için sıfırlanır.
            </p>
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

        <form action={formAction} className="space-y-4">
          <ProductCreateFields
            categories={categories}
            key={state.nonce ?? "new"}
            onUploaded={(url) => pendingUploads.current.add(url)}
            onUploadingChange={setUploading}
            pending={pending}
          />

          {state.error ? (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          ) : null}

          <button
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || uploading > 0}
            type="submit"
          >
            {uploading > 0
              ? "Görseller yükleniyor..."
              : pending
                ? "Kaydediliyor..."
                : "Ürünü Kaydet"}
          </button>
        </form>

        {created.length > 0 ? (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              Bu oturumda eklenenler
            </p>
            <ul className="mt-2 space-y-1">
              {created.map((product, index) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 text-sm text-green-900"
                  key={`${product.id}-${index}`}
                >
                  <span>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-green-700">
                      {" "}
                      · {product.code} · {product.variantCount} varyant
                    </span>
                  </span>
                  <Link
                    className="font-semibold text-green-800 underline transition hover:text-green-900"
                    href={`/admin/urunler/${product.id}`}
                  >
                    Düzenle
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProductCreateFields({
  categories,
  onUploaded,
  onUploadingChange,
  pending,
}: {
  categories: CategoryOption[];
  onUploaded: (url: string) => void;
  onUploadingChange: (pending: number) => void;
  pending: boolean;
}) {
  const [variants, setVariants] = useState<VariantDraft[]>([
    createVariantDraft(),
  ]);

  const payload = variants.map((variant) => ({
    name: variant.name,
    price: variant.price,
    stock: variant.stock,
    imageUrls: parseImageUrlList(variant.imageUrlsText, true),
    uploads: variant.uploads,
    isHidden: variant.isHidden,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="product-name">
            Ürün adı
          </label>
          <input
            className={inputClass}
            id="product-name"
            name="name"
            placeholder="Örn. Promosyon Kalem"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="product-code">
            Ürün kodu
          </label>
          <input
            className={inputClass}
            id="product-code"
            name="code"
            placeholder="Boş bırakılırsa MAN-<id> üretilir"
          />
        </div>

        <CategorySelect categories={categories} />

        <div>
          <label className={labelClass} htmlFor="product-tags">
            Etiketler
          </label>
          <input
            className={inputClass}
            id="product-tags"
            name="tags"
            placeholder="Virgülle ayırın: kalem, promosyon, hediye"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="product-image-urls">
            Ürün görselleri (virgülle ayırın)
          </label>
          <textarea
            className={`${inputClass} min-h-20`}
            id="product-image-urls"
            name="imageUrls"
            placeholder="https://ornek.com/1.jpg, https://ornek.com/2.jpg"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Yalnızca http(s) adresleri. Varyant görselleri aşağıdan eklenir.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="product-description">
            Açıklama
          </label>
          <textarea
            className={`${inputClass} min-h-24`}
            id="product-description"
            name="description"
          />
        </div>

        <div className="flex flex-wrap gap-6 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              className="h-4 w-4 accent-orange-600"
              name="isFeatured"
              type="checkbox"
            />
            Öne çıkan ürün
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              className="h-4 w-4 accent-orange-600"
              name="isHidden"
              type="checkbox"
            />
            Sitede gizle
          </label>
        </div>
      </div>

      <input
        name="variants"
        type="hidden"
        value={JSON.stringify(payload)}
      />

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100/60 p-4">
        <p className="mb-3 text-sm font-bold text-zinc-800">Varyantlar</p>
        <VariantEditor
          disabled={pending}
          onChange={setVariants}
          onUploaded={onUploaded}
          onUploadingChange={onUploadingChange}
          variants={variants}
        />
      </div>
    </div>
  );
}
