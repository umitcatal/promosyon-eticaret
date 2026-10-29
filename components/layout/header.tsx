import { Suspense } from "react";
import { CartLink } from "./cart-link";
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
      <div className="relative">
        <input
          aria-label="Ürün ara"
          className="w-full rounded-full border border-zinc-300 bg-zinc-50 py-2 pl-4 pr-11 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
          name="q"
          placeholder="Ürün, kategori veya ürün kodu ara..."
          type="search"
        />
        <button
          aria-label="Ara"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-orange-50 hover:text-orange-600"
          type="submit"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}

function UserMenuFallback() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-9 w-16 animate-pulse rounded-full bg-zinc-100" />
      <span className="hidden h-9 w-20 animate-pulse rounded-full bg-zinc-100 sm:block" />
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
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <SiteLogo />
        <div className="hidden flex-1 md:block">
          <SearchForm />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu />
          </Suspense>
          <Suspense
            fallback={
              <span className="h-10 w-10 animate-pulse rounded-full bg-zinc-100" />
            }
          >
            <CartLink />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-3 md:hidden">
        <SearchForm />
      </div>

      <SiteNav categories={tree} items={navItems} />
    </header>
  );
}
