import { Suspense } from "react";
import { CartLink } from "./cart-link";
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

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/arama" className={className} method="GET" role="search">
      <div className="group relative flex items-center">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-0 size-4 text-ink-muted transition-colors group-focus-within:text-brand-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          aria-label="Ürün ara"
          className="w-full border-b border-line-strong bg-transparent py-1.5 pl-7 pr-3 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 group-focus-within:border-brand-600"
          name="q"
          placeholder="Ürün, kategori veya kod ara"
          type="search"
        />
      </div>
    </form>
  );
}

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
      <div data-collapse>
        <div>
          <div className="border-b border-line/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              <span>Fiyatlar teklif bazlıdır</span>
              <span className="hidden sm:block">
                Kurumsal baskı · Geniş ürün yelpazesi
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="site-header-bar mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 sm:gap-8">
        <SiteLogo />
        <SearchForm className="hidden flex-1 lg:block" />
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu />
          </Suspense>
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
            <SearchForm className="mx-auto max-w-7xl px-4 pb-3" />
          </div>
        </div>
      </div>

      <SiteNav categories={tree} items={navItems} />
    </ScrollHeaderFrame>
  );
}
