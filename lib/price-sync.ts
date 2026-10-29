import { db, getSetting } from "./db";

export type PriceSyncResult = {
  updated: number;
  source: string;
};

export function getPriceXmlUrl(): string | null {
  const fromSettings = getSetting("price_xml_url");
  if (fromSettings && fromSettings.trim()) return fromSettings.trim();
  const fromEnv = process.env.PRICE_XML_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return null;
}

export async function syncPrices(): Promise<PriceSyncResult> {
  const url = getPriceXmlUrl();
  if (!url) {
    throw new Error(
      "Fiyat XML adresi tanımlı değil. Admin > Ayarlar bölümünden veya PRICE_XML_URL ortam değişkeninden ekleyin."
    );
  }

  const xml = await fetchRawXml(url);
  if (!xml.trim()) {
    throw new Error("Fiyat XML içeriği boş döndü.");
  }

  const records = parsePriceRecords();
  if (records.length === 0) {
    throw new Error(
      "Fiyat XML formatı tanınamadı. Adres ve örnek veri paylaşıldığında bu adaptör güncellenecek."
    );
  }

  const updateByProductCode = db.prepare(`
    UPDATE variants SET price = ?, price_source = 'xml', price_updated_at = datetime('now')
    WHERE product_id = (SELECT id FROM products WHERE code = ?)
  `);

  let updated = 0;
  const run = db.transaction(() => {
    for (const record of records) {
      const info = updateByProductCode.run(record.price, record.code);
      updated += info.changes;
    }
  });
  run();

  return { updated, source: url };
}

async function fetchRawXml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: "application/xml,text/xml,*/*" },
  });
  if (!response.ok) {
    throw new Error(`Fiyat XML indirilemedi (${response.status}).`);
  }
  return response.text();
}

export type PriceRecord = {
  code: string;
  price: number;
};

export function parsePriceRecords(): PriceRecord[] {
  // Fiyat XML/API formatı henüz bilinmiyor. Adres ve örnek veri paylaşıldığında
  // bu fonksiyon gerçek alan eşlemesiyle güncellenecek. Beklenen çıktı:
  // [{ code: "1070", price: 1250.5 }, ...]
  return [];
}
