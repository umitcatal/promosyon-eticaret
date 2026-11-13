import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { getCatalogHref } from "@/lib/catalog";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { SearchProvider } from "@/components/search/search-provider";
import {
  DesktopSearchTrigger,
  MobileSearchTrigger,
} from "@/components/search/search-trigger";
import { CartLink } from "./cart-link";
import { HeaderPhone, HeaderPhoneBand } from "./header-phone";
import { ScrollHeaderFrame } from "./scroll-header-frame";
import { SiteLogo } from "./site-logo";
import { SiteNav } from "./site-nav";
import { UserMenu } from "./user-menu";
import {
  getCategoryTree,
  getHeaderCatalog,
  getMenuItemsCount,
  getMenuNavItems,
} from "@/lib/queries";
import type { MenuNavItem } from "@/lib/types";

function UserMenuFallback() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-8 w-20 animate-pulse rounded-sm bg-line/70" />
      <span className="h-8 w-8 animate-pulse rounded-sm bg-line/70" />
    </div>
  );
}

export async function Header() {
  const [menuItems, menuCount, tree, catalog] = await Promise.all([
    getMenuNavItems(),
    getMenuItemsCount(),
    getCategoryTree(),
    getHeaderCatalog(),
  ]);
  const catalogHref = getCatalogHref(catalog);
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
    <ScrollHeaderFrame>
      <SearchProvider>
        <div data-collapse>
          <div>
            <div className="border-b border-line/80">
              <div className={`mx-auto grid max-w-7xl grid-cols-2 items-center gap-x-3 gap-y-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:gap-x-6 ${catalogHref ? "sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" : ""}`}>
                <span className="col-start-1 whitespace-nowrap sm:row-start-1">Fiyatlar teklif bazlıdır</span>
                {catalogHref ? (
                  <a
                    href={catalogHref}
                    target={catalog.openInNewTab ? "_blank" : undefined}
                    rel={catalog.openInNewTab ? "noopener noreferrer" : undefined}
                    className="col-span-2 col-start-1 row-start-1 inline-flex max-w-full items-center justify-center gap-2 justify-self-center rounded-sm py-1 text-center font-semibold text-brand-700 underline-offset-4 transition-colors hover:text-brand-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:col-span-1 sm:col-start-2 sm:max-w-sm"
                  >
                    <BookOpen aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="min-w-0 break-words [overflow-wrap:anywhere]">{catalog.label}</span>
                    {catalog.openInNewTab ? <span className="sr-only"> (yeni sekmede açılır)</span> : null}
                  </a>
                ) : null}
                <span className="hidden text-right sm:col-start-[-2] sm:row-start-1 sm:block">
                  Kurumsal baskı · Geniş ürün yelpazesi
                </span>
                <div className="col-start-2 justify-self-end sm:hidden"><HeaderPhoneBand /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="site-header-bar mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 max-[380px]:gap-2 sm:gap-8">
          <SiteLogo />
          <DesktopSearchTrigger className="hidden flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-2.5 max-[380px]:gap-1.5 sm:gap-4">
            <HeaderPhone />
            <Suspense fallback={<UserMenuFallback />}>
              <UserMenu />
            </Suspense>
            <FavoritesLink />
            <Suspense
              fallback={<span className="size-9 animate-pulse rounded-sm bg-line/70" />}
            >
              <CartLink />
            </Suspense>
          </div>
        </div>

        <div className="lg:hidden">
          <div data-collapse>
            <div>
              <MobileSearchTrigger className="mx-auto block max-w-7xl px-4 pb-3" />
            </div>
          </div>
        </div>

        <SiteNav categories={tree} items={navItems} />
      </SearchProvider>
    </ScrollHeaderFrame>
  );
}
