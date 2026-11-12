import { Suspense } from "react";
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
  const [menuItems, menuCount, tree] = await Promise.all([
    getMenuNavItems(),
    getMenuItemsCount(),
    getCategoryTree(),
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
    <ScrollHeaderFrame>
      <SearchProvider>
        <div data-collapse>
          <div>
            <div className="border-b border-line/80">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:gap-6">
                <span className="whitespace-nowrap">Fiyatlar teklif bazlıdır</span>
                <span className="hidden sm:block">
                  Kurumsal baskı · Geniş ürün yelpazesi
                </span>
                <HeaderPhoneBand />
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
