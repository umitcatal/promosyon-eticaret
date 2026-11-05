import { CollectionManager } from "@/components/admin/collection-manager";
import { fetchCollections } from "@/lib/queries";

export const instant = false;

export const metadata = {
  title: "Koleksiyonlar",
};

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; durum?: string }>;
}) {
  const params = await searchParams;
  const collections = fetchCollections();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Koleksiyonlar</h2>
        <p className="text-sm text-zinc-500">
          Küratörlü ürün grupları oluşturun; ana sayfa widget alanında slider
          olarak yayınlayın.
        </p>
      </div>

      {params.hata === "referansli" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Bu koleksiyon bir ana sayfa widget&apos;ında kullanılıyor. Önce widget
          ayarını değiştirin veya widget&apos;ı silin.
        </p>
      ) : null}
      {params.durum === "silindi" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Koleksiyon silindi.
        </p>
      ) : null}

      <CollectionManager collections={collections} />
    </div>
  );
}
