import { SyncPricesButton } from "@/components/admin/sync-buttons";
import { SettingsForm } from "@/components/admin/settings-form";
import { db } from "@/lib/db";
import { getPriceXmlUrl } from "@/lib/price-sync";
import { DEFAULT_PRODUCT_XML_URL } from "@/lib/xml";

export const metadata = {
  title: "Ayarlar",
};

export default async function AdminSettingsPage() {
  const priceXmlUrl = getPriceXmlUrl() ?? "";
  const productXmlUrl =
    process.env.PRODUCT_XML_URL || DEFAULT_PRODUCT_XML_URL;
  const variantPrices = db
    .prepare(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN price IS NOT NULL THEN 1 ELSE 0 END) AS priced FROM variants WHERE active = 1"
    )
    .get() as { total: number; priced: number | null };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Ayarlar</h2>
        <p className="text-sm text-zinc-500">
          Veri kaynakları ve fiyatlandırma ayarları
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-bold text-zinc-900">
          Ürün / Kategori Kaynağı
        </h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Ürün ve kategori verileri aşağıdaki XML adresinden çekilir. Adresi
          değiştirmek için sunucudaki <code>PRODUCT_XML_URL</code> ortam
          değişkenini güncelleyin.
        </p>
        <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
          {productXmlUrl}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-bold text-zinc-900">Fiyat Kaynağı</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Fiyat XML/API adresi henüz sağlanmadı. Adres girildikten sonra fiyat
          güncelleme altyapısı (eşleme adaptörü) devreye alınacak.
        </p>
        <div className="mt-4">
          <SettingsForm priceXmlUrl={priceXmlUrl} />
        </div>
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <SyncPricesButton />
          <p className="mt-2 text-xs text-zinc-500">
            Aktif {variantPrices.total} varyantın {variantPrices.priced ?? 0}
            &apos;inde fiyat tanımlı.
          </p>
        </div>
      </section>
    </div>
  );
}
