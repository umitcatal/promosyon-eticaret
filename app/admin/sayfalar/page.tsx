import Link from "next/link";
import { DeletePageForm } from "@/components/admin/delete-page-form";
import { db } from "@/lib/db";
import type { Page } from "@/lib/types";

export const metadata = {
  title: "Sayfalar",
};

export default async function AdminPagesPage(
  props: PageProps<"/admin/sayfalar">
) {
  const query = await props.searchParams;
  const error = typeof query.hata === "string" ? query.hata : null;
  const message = typeof query.mesaj === "string" ? query.mesaj : null;

  const pages = db
    .prepare("SELECT * FROM pages ORDER BY title COLLATE NOCASE")
    .all() as Page[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Sayfalar</h2>
          <p className="text-sm text-zinc-500">
            {pages.length} sayfa • Menülerde kullanılacak içerik sayfaları
          </p>
        </div>
        <Link
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          href="/admin/sayfalar/yeni"
        >
          Yeni Sayfa
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        {pages.map((page) => (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            key={page.id}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {page.title}
              </p>
              <p className="truncate text-xs text-zinc-500">
                /{page.slug} • {page.active === 1 ? "Yayında" : "Taslak"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {page.active === 1 ? (
                <Link
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/${page.slug}`}
                  target="_blank"
                >
                  Görüntüle
                </Link>
              ) : null}
              <Link
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                href={`/admin/sayfalar/${page.id}`}
              >
                Düzenle
              </Link>
              <DeletePageForm pageId={page.id} />
            </div>
          </div>
        ))}

        {pages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            Henüz sayfa yok. &quot;Yeni Sayfa&quot; ile ilk içeriği oluşturun.
          </p>
        ) : null}
      </div>
    </div>
  );
}
