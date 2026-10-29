"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { savePageAction } from "@/app/actions/content";
import type { AdminActionState } from "@/app/actions/admin";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { inputClass, labelClass } from "@/components/ui/styles";
import { slugify } from "@/lib/slug";
import type { Page } from "@/lib/types";

const initialState: AdminActionState = {};

export function PageForm({
  page,
  returnTo = "/admin/sayfalar",
}: {
  page?: Page;
  returnTo?: string;
}) {
  const [state, formAction, pending] = useActionState(
    savePageAction,
    initialState
  );
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(page?.slug));

  return (
    <form action={formAction} className="space-y-5">
      {page ? (
        <input name="pageId" type="hidden" value={page.id} />
      ) : null}
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="page-title">
            Başlık *
          </label>
          <input
            className={inputClass}
            id="page-title"
            name="title"
            onChange={(event) => {
              const value = event.target.value;
              setTitle(value);
              if (!slugTouched) setSlug(slugify(value));
            }}
            required
            value={title}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="page-slug">
            Adres (slug) *
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
            <span className="border-r border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400">
              /
            </span>
            <input
              className="w-full bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              id="page-slug"
              name="slug"
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              placeholder="hakkimizda"
              value={slug}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Boş bırakılırsa başlıktan üretilir.
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="page-meta-title">
          SEO başlığı
        </label>
        <input
          className={inputClass}
          defaultValue={page?.meta_title ?? ""}
          id="page-meta-title"
          name="metaTitle"
          placeholder="Boş bırakılırsa sayfa başlığı kullanılır"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="page-meta-description">
          SEO açıklaması
        </label>
        <textarea
          className={`${inputClass} min-h-20`}
          defaultValue={page?.meta_description ?? ""}
          id="page-meta-description"
          name="metaDescription"
        />
      </div>

      <div>
        <label className={labelClass}>İçerik</label>
        <RichTextEditor
          initialContent={page?.content ?? ""}
          name="content"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          className="h-4 w-4 accent-orange-600"
          defaultChecked={page ? page.active === 1 : true}
          name="active"
          type="checkbox"
        />
        Yayında
      </label>

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <Link
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          href="/admin/sayfalar"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
