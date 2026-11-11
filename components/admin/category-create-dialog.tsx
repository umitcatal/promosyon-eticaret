"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { X } from "lucide-react";
import {
  createCategoryAction,
  type CategoryActionState,
} from "@/app/actions/categories";
import { CategorySelect } from "@/components/admin/category-select";
import { inputClass, labelClass } from "@/components/ui/styles";
import { isRemoteImageUrl } from "@/lib/image-urls";
import type { CategoryOption } from "@/lib/types";

const initialState: CategoryActionState = {};

const fileInputClass =
  "block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700";

type CreatedCategory = NonNullable<CategoryActionState["created"]>;

export function CategoryCreateDialog({
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
        Yeni Kategori Ekle
      </button>

      {open ? (
        <CategoryCreateSession
          categories={categories}
          key={session}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CategoryCreateSession({
  categories,
  onClose,
}: {
  categories: CategoryOption[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
    initialState
  );
  const [created, setCreated] = useState<CreatedCategory[]>([]);
  const [lastNonce, setLastNonce] = useState<string | undefined>(undefined);
  const panelRef = useRef<HTMLDivElement>(null);

  if (state.nonce && state.nonce !== lastNonce) {
    setLastNonce(state.nonce);
    const category = state.created;
    if (category) setCreated((previous) => [...previous, category]);
  }

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
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
        aria-labelledby="category-create-title"
        aria-modal="true"
        className="my-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-5 shadow-xl"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-base font-bold text-zinc-900"
              id="category-create-title"
            >
              Yeni Kategori Ekle
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Eklenen kategori XML beslemesinden etkilenmez; manuel ürünlerde
              kullanılabilir. Görseller sharp ile optimize edilip sunucuya
              kaydedilir.
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
          <CategoryCreateFields
            categories={categories}
            key={state.nonce ?? "new"}
          />

          {state.error ? (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          ) : null}

          <button
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Kaydediliyor..." : "Kategoriyi Kaydet"}
          </button>
        </form>

        {created.length > 0 ? (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              Bu oturumda eklenenler
            </p>
            <ul className="mt-2 space-y-1">
              {created.map((category, index) => (
                <li
                  className="text-sm text-green-900"
                  key={`${category.id}-${index}`}
                >
                  <span className="font-medium">{category.name}</span>
                  <span className="text-green-700"> · /{category.slug}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CategoryCreateFields({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setImageUrl("");
  }

  function handleUrlChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setImageUrl(value);
    if (value.trim() && fileRef.current?.value) {
      fileRef.current.value = "";
      setPreview(null);
    }
  }

  const remotePreview =
    !preview && isRemoteImageUrl(imageUrl.trim()) ? imageUrl.trim() : null;
  const imageSrc = preview ?? remotePreview;

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="category-name">
          Kategori adı
        </label>
        <input
          className={inputClass}
          id="category-name"
          name="name"
          placeholder="Örn. Promosyon Bardak"
          required
        />
      </div>

      <CategorySelect
        categories={categories}
        emptyLabel="Kök kategori"
        id="category-parent"
        label="Üst kategori"
        name="parentId"
      />

      <div className="md:col-span-2">
        <span className={labelClass}>Kategori görseli</span>
        <div className="flex flex-wrap items-start gap-3">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Kategori görseli önizlemesi"
              className="h-16 w-16 shrink-0 rounded-lg border border-zinc-200 object-cover"
              src={imageSrc}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">
              Yok
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <label className={labelClass} htmlFor="category-image-file">
                Dosyadan yükle
              </label>
              <input
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className={fileInputClass}
                id="category-image-file"
                name="image"
                onChange={handleFileChange}
                ref={fileRef}
                type="file"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="category-image-url">
                veya URL&apos;den çek
              </label>
              <input
                className={inputClass}
                id="category-image-url"
                name="imageUrl"
                onChange={handleUrlChange}
                placeholder="https://ornek.com/kategori.jpg"
                type="url"
                value={imageUrl}
              />
            </div>
            <p className="text-xs text-zinc-400">
              JPEG, PNG, WEBP, GIF veya AVIF • en fazla 5 MB • her iki durumda da
              WEBP&apos;ye optimize edilir ve sunucuya kopyalanır
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="category-sort">
          Sıra
        </label>
        <input
          className={inputClass}
          defaultValue="0"
          id="category-sort"
          name="sortOrder"
          type="number"
        />
      </div>

      <div className="flex items-end gap-6 pb-2">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked
            name="active"
            type="checkbox"
          />
          Aktif
        </label>
        <label
          className="flex items-center gap-2 text-sm font-medium text-zinc-700"
          title="Ana sayfadaki Ürün Grupları bölümünde göster"
        >
          <input
            className="h-4 w-4 accent-orange-600"
            name="showOnHome"
            type="checkbox"
          />
          Ana sayfa
        </label>
      </div>

      <details className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 md:col-span-2">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500">
          SEO metinleri
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="category-meta-title">
              SEO başlığı
            </label>
            <input
              className={inputClass}
              id="category-meta-title"
              name="metaTitle"
              placeholder="Boş bırakılırsa otomatik başlık kullanılır"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="category-meta-description">
              SEO açıklaması
            </label>
            <textarea
              className={`${inputClass} min-h-20`}
              id="category-meta-description"
              name="metaDescription"
              placeholder="Boş bırakılırsa otomatik açıklama kullanılır"
            />
          </div>
        </div>
      </details>
    </div>
  );
}