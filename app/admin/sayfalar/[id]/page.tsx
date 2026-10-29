import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/page-form";
import { db } from "@/lib/db";
import type { Page } from "@/lib/types";

export const metadata = {
  title: "Sayfayı Düzenle",
};

export default async function EditAdminPage(
  props: PageProps<"/admin/sayfalar/[id]">
) {
  const { id } = await props.params;
  const pageId = Number(id);
  if (!Number.isInteger(pageId) || pageId <= 0) notFound();

  const page = db
    .prepare("SELECT * FROM pages WHERE id = ?")
    .get(pageId) as Page | undefined;
  if (!page) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Sayfayı Düzenle</h2>
        <p className="text-sm text-zinc-500">/{page.slug}</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <PageForm page={page} />
      </div>
    </div>
  );
}
