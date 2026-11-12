import { Suspense } from "react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import { getCurrentUser } from "@/lib/auth";
import {
  getCategoryTree,
  getMenuItemsCount,
  getMenuNavItems,
  getSiteContact,
} from "@/lib/queries";
import type { MenuNavItem } from "@/lib/types";

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

async function FooterAccountLinks() {
  const user = await getCurrentUser();
  const linkClass = "text-paper/65 transition-colors hover:text-brass-200";

  return (
    <>
      {user ? (
        <li>
          <Link className={linkClass} href="/hesabim">
            Hesabım
          </Link>
        </li>
      ) : (
        <>
          <li>
            <Link className={linkClass} href="/giris">
              Giriş Yap
            </Link>
          </li>
          <li>
            <Link className={linkClass} href="/kayit">
              Üye Ol
            </Link>
          </li>
        </>
      )}
      <li>
        <Link className={linkClass} href="/sepet">
          Sepetim
        </Link>
      </li>
    </>
  );
}

export async function Footer() {
  const [tree, year, contact, menuItems, menuCount] = await Promise.all([
    getCategoryTree(),
    getCopyrightYear(),
    getSiteContact(),
    getMenuNavItems(),
    getMenuItemsCount(),
  ]);
  const navItems: MenuNavItem[] =
    menuCount > 0
      ? menuItems
      : [
          {
            id: -1,
            label: "Ürünler",
            type: "categories",
            href: "/urunler",
            open_in_new_tab: false,
          },
        ];

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
            <ColumnLabel>Menü</ColumnLabel>
            <ul className="mt-5 space-y-2.5 text-sm">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    className="text-paper/65 transition-colors hover:text-brass-200"
                    href={item.href}
                    rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                    target={item.open_in_new_tab ? "_blank" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <Suspense fallback={null}>
                <FooterAccountLinks />
              </Suspense>
            </ul>
          </div>

          <div className="lg:pl-8">
            <ColumnLabel>İletişim</ColumnLabel>
            <ul className="mt-5 space-y-4 text-sm">
              {contact.phone && contact.phoneDisplay ? (
                <li>
                  <a
                    aria-label={`Telefon: ${contact.phoneDisplay}`}
                    className="group flex items-start gap-3"
                    href={`tel:+${contact.phone}`}
                  >
                    <Phone
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brass-300"
                    />
                    <span className="font-display text-lg font-semibold text-paper transition-colors group-hover:text-brass-200">
                      {contact.phoneDisplay}
                    </span>
                  </a>
                </li>
              ) : null}
              {contact.address ? (
                <li className="flex items-start gap-3">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brass-300"
                  />
                  <span className="leading-6 whitespace-pre-line text-paper/65">
                    {contact.address}
                  </span>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a
                    aria-label={`E-posta: ${contact.email}`}
                    className="group flex items-start gap-3"
                    href={`mailto:${contact.email}`}
                  >
                    <Mail
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brass-300"
                    />
                    <span className="break-all text-paper/65 transition-colors group-hover:text-brass-200">
                      {contact.email}
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
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
