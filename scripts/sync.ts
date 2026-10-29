import "./env";
import { syncCatalog } from "../lib/sync";

async function main() {
  console.log("Katalog XML güncelleniyor (API -> data/xml/urunler.xml -> DB)...");
  const result = await syncCatalog();
  console.log(
    `Tamamlandı. Kaynak: ${result.source} (${result.xmlPath}) | ` +
      `${result.products} ürün, ${result.variants} varyant, ` +
      `${result.priceUpdated} fiyat güncellendi, ` +
      `${result.categoryImages} kategori görseli dolduruldu | ` +
      `${result.codeTransfers} kod devredildi | ${result.durationMs} ms`
  );
}

main().catch((error) => {
  console.error("Sync hatası:", error);
  process.exit(1);
});
