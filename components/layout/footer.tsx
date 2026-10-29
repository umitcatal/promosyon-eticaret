import { cacheLife } from "next/cache";
import Link from "next/link";
import { SiteLogo } from "@/components/layout/site-logo";
import { getCategoryTree } from "@/lib/queries";

async function getCopyrightYear(): Promise<number> {
  "use cache";
  cacheLife("weeks");
  return new Date().getFullYear();
}

export async function Footer() {
  const tree = await getCategoryTree();
  const year = await getCopyrightYear();

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-900 text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <SiteLogo href={null} tone="dark" />
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
            Kurumsal promosyon ürünlerinde kalem, çanta, teknoloji ve daha
            fazlası. Şirket logonuzla özelleştirilebilen binlerce ürün çeşidi.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">
            Kategoriler
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {tree.slice(0, 8).map((top) => (
              <li key={top.id}>
                <Link
                  className="transition hover:text-orange-400"
                  href={`/kategori/${top.slug}`}
                >
                  {top.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">
            Hesap
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="transition hover:text-orange-400" href="/giris">
                Giriş Yap
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-orange-400" href="/kayit">
                Üye Ol
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-orange-400" href="/hesabim">
                Hesabım
              </Link>
            </li>
            <li>
              <Link className="transition hover:text-orange-400" href="/sepet">
                Sepetim
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row">
          <p>© {year} Promosyon Eticaret. Tüm hakları saklıdır.</p>
          <p>Fiyatlar teklif bazlıdır; sipariş sonrası tarafımızca iletilir.</p>
        </div>
      </div>
    </footer>
  );
}
