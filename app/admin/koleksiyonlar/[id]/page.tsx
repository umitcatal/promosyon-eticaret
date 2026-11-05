import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/admin/collection-form";
import {
  fetchAdminCategoryOptions,
  fetchCollectionEditorData,
} from "@/lib/queries";

export const instant = false;

export const metadata = {
  title: "Koleksiyon Düzenle",
};

export default async function AdminCollectionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collectionId = Number(id);
  if (!Number.isInteger(collectionId) || collectionId <= 0) notFound();

  const data = fetchCollectionEditorData(collectionId);
  if (!data) notFound();

  const categories = fetchAdminCategoryOptions();

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:text-zinc-700"
          href="/admin/koleksiyonlar"
        >
          ← Koleksiyonlar
        </Link>
        <h2 className="mt-2 text-lg font-bold text-zinc-900">
          {data.collection.name}
        </h2>
        <p className="text-sm text-zinc-500">
          Ürünleri elle ekleyin veya kategori seçin. Manuel ürünler listenin
          başında gösterilir; alt kategoriler isteğe bağlı dahil edilir.
        </p>
      </div>

      <CollectionForm
        categories={categories}
        categoryIds={data.categoryIds}
        collection={data.collection}
        products={data.products}
      />
    </div>
  );
}
