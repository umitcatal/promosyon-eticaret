# Kurumsal Promo

Kurumsal promosyon ürünleri satan, ürün/kategori verilerini XML beslemesinden
çeken Next.js tabanlı e-ticaret uygulaması.

## Özellikler

- Ana sayfada slider + görselli kategori vitrini
- Kategori ve ürün sayfaları, arama, varyant (renk vb.) seçimi
- Üyelik: e-posta/telefon ile kayıt veya Google ile hızlı giriş
- Sepet ve teklif/sipariş akışı (siparişler admin panelde yönetilir)
- Admin panel: ürün/fiyat yönetimi, kategori görselleri, slider, üyeler,
  siparişler, ayarlar ve XML güncelleme
- Yönetilebilir header menüsü: kod rotaları, rich text içerik sayfaları ve
  kategorileri mega menü olarak gösteren menü öğeleri (`/admin/menu`)
- Rich text editörlü içerik sayfaları; sayfa adresi kod tarafındaki bir rota ile
  çakışırsa Next.js statik rotayı öncelikler (`/admin/sayfalar`)
- Ürün/kategori XML beslemesinden otomatik senkronizasyon; XML önce
  `data/xml/urunler.xml` dosyasına yazılır, DB'ye oradan işlenir
- API'ye ulaşılamadığında klasördeki mevcut XML dosyasıyla güncelleme
- Fiyat XML/API altyapısı (ayrı besleme adresi tanımlandığında devreye alınacak)

## Teknolojiler

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript ·
Tailwind CSS 4 · SQLite (better-sqlite3) · iron-session · Zod

## Kurulum

```bash
npm install
cp .env.example .env.local   # değerleri düzenleyin
```

`.env.local` içinde en az `SESSION_PASSWORD` (32+ karakter) ve `SYNC_SECRET`
tanımlanmalıdır.

### İlk veri ve admin

```bash
npm run db:sync    # ürün/kategori/görselleri XML'den çeker
npm run db:admin   # .env.local içindeki ADMIN_* bilgileriyle admin oluşturur
```

Alternatif olarak admin hesabını elle oluşturabilirsiniz:

```bash
npm run db:admin -- admin@sirket.com GucluSifre123
```

### Geliştirme

```bash
npm run dev
```

- Site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## Ortam Değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `SESSION_PASSWORD` | iron-session şifreleme anahtarı (en az 32 karakter) |
| `NEXT_PUBLIC_SITE_URL` | Varsayılan sitenin tam adresi (yalnızca fallback; asıl eşleme aşağıdaki site değişkenleriyle yapılır) |
| `DEFAULT_SITE_ID` | Bilinmeyen host ve fallback durumlarında kullanılacak site (varsayılan `1`) |
| `SITE_IDS` | Aktif site kimlikleri, ör. `1,2` |
| `SITE_HOSTS` | Host → site eşlemesi, ör. `site1.com:1,www.site1.com:1,site2.com:2` |
| `SITE_URLS` | Site → public URL eşlemesi, ör. `1:https://site1.com,2:https://site2.com` |
| `TURNSTILE_SITE_KEY_1` / `TURNSTILE_SECRET_KEY_1` | 1. site Cloudflare Turnstile anahtarları |
| `TURNSTILE_SITE_KEY_2` / `TURNSTILE_SECRET_KEY_2` | 2. site Cloudflare Turnstile anahtarları |
| `DB_PATH` | SQLite dosya yolu (varsayılan `./data/promosyon.db`) |
| `PRODUCT_XML_URL` | Ürün/kategori XML adresi (yalnızca sunucudan çekilebilir) |
| `PRODUCT_XML_PATH` | XML dosyasının kaydedilip okunacağı yol (varsayılan `./data/xml/urunler.xml`) |
| `PRICE_XML_URL` | Fiyat XML/API adresi (henüz yok, admin panelden de girilebilir) |
| `SYNC_SECRET` | `/api/sync` uç noktası için Bearer anahtarı |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google ile giriş (boşsa buton gizlenir) |
| `ADMIN_*` | `npm run db:admin` için varsayılan admin bilgileri |

Cloudflare Turnstile widget'ında her sitenin hostname'lerini (`SITE_HOSTS` ile
aynı alan adları) izinli listeye ekleyin. Secret key yalnızca sunucu ortamında
tutulur. Eski `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`
değişkenleri yalnızca varsayılan site için fallback olarak okunur.

### Çoklu site

Tek Next.js süreci, tek SQLite dosyası ve tek `public/uploads` klasörü iki
domaini de besler. `proxy.ts` gelen `Host` başlığını `SITE_HOSTS` ile eşleyip
isteği `/{siteId}/...` yoluna rewrite eder. Ürünler, kategoriler, kullanıcılar
ve medya ortaktır; sayfalar, menü, slider, anasayfa widget'ları, koleksiyonlar,
siparişler ve site ayarları (logo, iletişim, mail, WhatsApp, GA, tema) site
bazlıdır. Admin panelde üstteki site seçici ile aktif site değiştirilir.

Yerel geliştirmede iki siteyi denemek için `SITE_HOSTS` içine
`localhost:1,127.0.0.1:2` ekleyip istekleri uygun `Host` başlığıyla gönderin
(veya `http://localhost:3000/1/...` gibi doğrudan site yolunu kullanın; bu
yollar `X-Robots-Tag: noindex` alır).

## Google ile Giriş

1. Google Cloud Console > APIs & Services > Credentials bölümünde OAuth Client
   (Web application) oluşturun.
2. Authorized redirect URI listesine her iki domain için
   `https://<domain>/api/auth/callback/google` ekleyin; JS origin olarak da
   iki domaini tanımlayın.
3. `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` değerlerini `.env.local`
   dosyasına yazın. Dönüş adresi istek host'una göre `SITE_URLS` üzerinden
   üretilir; ayrıca `GOOGLE_REDIRECT_URI` tanımlamaya gerek yoktur.

## XML Senkronizasyonu

Senkronizasyon şu sırayla çalışır:

1. `PRODUCT_XML_URL`'den XML sunucu tarafında çekilir.
2. Ham XML `data/xml/urunler.xml` dosyasına atomik olarak yazılır.
3. Dosya okunur, parse edilir ve ürünler/fiyatlar DB'ye işlenir.
4. API'ye ulaşılamazsa (403/timeout) klasördeki mevcut dosya kullanılır;
   her ikisi de yoksa anlaşılır bir hata döner.

```bash
npm run db:sync
```

Admin panel > Genel Bakış ekranındaki **"Ürünleri XML'den Güncelle"** butonu da
aynı işlemi yapar ve sonucun kaynağını (API/dosya) mesajda gösterir. Cron ile
otomatik güncelleme için:

```bash
curl -X POST -H "Authorization: Bearer $SYNC_SECRET" https://<domain>/api/sync
```

### XML dosyasını elle koyma

API yalnızca sunucudan erişilebiliyorsa dosyayı sunucuda indirip yerel
depozitorya kopyalayabilirsiniz:

```bash
# sunucuda
curl -o urunler.xml "$PRODUCT_XML_URL"
# dosyayı indirip yerelde şu yola koyun
mkdir -p data/xml && mv urunler.xml data/xml/
```

Klasör yoksa kod ilk yazımda otomatik oluşturur. `data/` sürüm kontrolüne
dahil değildir.

Senkronizasyon; ürün adı, açıklama, kategori, görsel, varyant ve fiyat
alanlarını günceller. Varyant fiyatı `listefiyati` alanından yazılır
(müşteri bu fiyatı görür, `price_source='xml'`); `netfiyat` ve `iskonto`
ayrıca saklanır ve admin ürün düzenleme ekranında gösterilir. Alan yoksa
mevcut fiyata dokunulmaz. Gizlilik ayarları korunur; kaynaktan kalkan
ürünler silinmez, pasife alınır.

Ayrıca her senkronda:

- **Stok**: `stokmiktar` varyant bazlı `variants.stock`'a yazılır; 0 ise
  sitede "Tükendi" gösterilir ve sepete ekleme kapatılır.
- **Baskı fiyatları**: `urunbaskifiyatlari` HTML'i `products.baski_fiyatlari`'na
  yazılır ve ürün detay sayfasında kart olarak gösterilir.
- **Kategori görselleri**: Her kategorinin ilk ürün görseli XML'den alınıp
  `categories.image_url`'a yazılır; alt kategorisi olan kategoriler görseli
  çocuklarından devralır. Yalnızca boş satırlar doldurulur, admin panelden
  yüklenen görseller hiç ezilmez. Mega menü ve kategori vitrini bu kalıcı
  değeri kullanır (`categoryImages` olarak raporlanır).

Ürün kodu (`products.code`) benzersizdir. Beslemeden kalkan bir ürünün kodunu
yeni bir ürün devralırsa eski satırın kodu `KOD-ID` biçimine çevrilir (eski
ürün zaten pasife alınır) ve sonuç `codeTransfers` olarak raporlanır.

### Manuel Ürünler

Admin > Ürünler ekranındaki **Yeni Ürün Ekle** butonuyla beslemeden bağımsız
ürün oluşturulabilir. Manuel ürün ve varyantlar `source='manual'` olarak
işaretlenir ve `1.000.000.000` ve üzeri pozitif ID alır; XML senkronizasyonu bu
satırları pasife almaz, kodlarını değiştirmez ve fiyatlarını güncellemez.

- Ürün görselleri virgülle ayrılmış `http(s)` URL'leri olarak
  `products.images` alanında saklanır.
- Varyant görselleri URL ve/veya dosya yüklemesiyle eklenir. Yüklenen dosyalar
  `sharp` ile en fazla 1600×1600 WebP (kalite 82) olarak
  `public/uploads/products/` altına yazılır.
- Ürün detay galerisi önce ürün URL görsellerini, ardından seçili varyantın
  görsellerini tekrarsız gösterir. Ürün kartları ürün görseli yoksa ilk varyant
  görselini kullanır.
- `public/uploads/products/` klasörünü de yedeğe dahil edin.

Şema değişiklikleri (`source`, `images`) uygulama ilk açılışta `ensureColumn`
ile mevcut veritabanına eklenir; backfill gerekmez, PM2 restart yeterlidir.

## Yayına Alma (VPS)

```bash
npm ci
npm run build
npm run start        # varsayılan port 3000
```

- SQLite dosyası `data/` klasöründe tutulur; düzenli yedekleyin.
- Slider, kategori, logo ve ürün görselleri `public/uploads/slider/`,
  `public/uploads/categories/`, `public/uploads/logo/` ve
  `public/uploads/products/` altında tutulur; bu klasörleri de yedekleyin.
- `data/` ve `public/uploads/` klasörleri sürüm kontrolüne dahil edilmez.
- Cron örneği (her gün 04:00):

```cron
0 4 * * * curl -s -X POST -H "Authorization: Bearer <SYNC_SECRET>" http://localhost:3000/api/sync > /dev/null
```

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Prodüksiyon derlemesi |
| `npm run start` | Prodüksiyon sunucusu |
| `npm run lint` | ESLint |
| `npm run db:sync` | XML'den katalog senkronizasyonu |
| `npm run db:admin` | Admin hesabı oluşturur/günceller |

## Fiyatlandırma Notu

Katalog XML'inde fiyat alanı bulunursa (örn. `fiyat`, `satisfiyati`,
`price`, `tutar`) senkronizasyonda doğrudan varyant fiyatlarına yazılır.
XML'de fiyat yoksa mevcut fiyatlar korunur; fiyatlar ayrıca admin panelden
manuel girilebilir veya PRICE_XML_URL ile ayrı bir fiyat beslemesinden
çekilebilir. Fiyat tanımlı olmayan ürünlerde sitede "Teklif İste" gösterilir.
