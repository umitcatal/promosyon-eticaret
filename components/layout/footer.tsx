import { cacheLife } from "next/cache";
import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { getCategoryTree } from "@/lib/queries";

async function getCopyrightYear(): Promise<number> {
  "use cache";
  cacheLife("weeks");
  return new Date().getFullYear();
}

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-300">
      {children}
    </p>
  );
}

export async function Footer() {
  const tree = await getCategoryTree();
  const year = await getCopyrightYear();

  return (
    <footer className="mt-24 bg-ink text-paper/70">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 border-b border-paper/10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-12">
          <div>
            <SiteLogo href={null} tone="dark" />
            <p className="mt-5 max-w-xs text-sm leading-7 text-paper/55">
              Kurumsal promosyon ürünlerinde kalem, çanta, teknoloji ve daha
              fazlası. Şirket logonuzla özelleştirilebilen binlerce ürün çeşidi.
            </p>
          </div>

          <div>
            <ColumnLabel>Koleksiyon</ColumnLabel>
            <ul className="mt-5 space-y-2.5 text-sm">
              {tree.slice(0, 8).map((top) => (
                <li key={top.id}>
                  <Link
                    className="text-paper/65 transition-colors hover:text-brass-200"
                    href={`/kategori/${top.slug}`}
                  >
                    {top.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnLabel>Hesap</ColumnLabel>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li>
                <Link
                  className="text-paper/65 transition-colors hover:text-brass-200"
                  href="/giris"
                >
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link
                  className="text-paper/65 transition-colors hover:text-brass-200"
                  href="/kayit"
                >
                  Üye Ol
                </Link>
              </li>
              <li>
                <Link
                  className="text-paper/65 transition-colors hover:text-brass-200"
                  href="/hesabim"
                >
                  Hesabım
                </Link>
              </li>
              <li>
                <Link
                  className="text-paper/65 transition-colors hover:text-brass-200"
                  href="/sepet"
                >
                  Sepetim
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:pl-8">
            <ColumnLabel>Teklif</ColumnLabel>
            <p className="mt-5 font-display text-xl leading-snug font-semibold text-paper">
              Liste fiyatımız yok; size özel fiyat veriyoruz.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-3 rounded-sm bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brass-200"
              href="/urunler"
            >
              Ürünleri görüntüleyin
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 py-6 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/40 sm:flex-row sm:items-center">
          <p>© {year} Kurumsal Promo</p>
          <p>Fiyatlar teklif bazlıdır; sipariş sonrası iletilir.</p>
        </div>
      </div>
    </footer>
  );
}
