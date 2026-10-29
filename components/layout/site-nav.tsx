"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import type { CategoryNode, MenuNavItem } from "@/lib/types";

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-3 w-3 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" />
    </svg>
  );
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}

function CategoryChildren({
  category,
  onNavigate,
}: {
  category: CategoryNode;
  onNavigate: () => void;
}) {
  if (category.children.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        Bu kategoride alt kategori bulunmuyor.
      </p>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {category.children.map((child) => (
        <div key={child.id}>
          <Link
            className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            href={`/kategori/${child.slug}`}
            onClick={onNavigate}
          >
            <div className="relative aspect-square w-full bg-zinc-50">
              <ProductImage
                alt={child.name}
                className="object-contain p-3 transition duration-300 group-hover:scale-105"
                fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-zinc-50 to-zinc-100 text-4xl font-bold text-orange-200"
                fallbackLabel={child.name}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                src={child.image_url}
                unoptimized={child.image_url?.startsWith("http") ?? false}
              />
            </div>
            <p className="line-clamp-2 border-t border-zinc-100 px-3 py-2 text-center text-[13px] font-semibold leading-5 text-zinc-800 transition group-hover:text-orange-700">
              {child.name}
            </p>
          </Link>
          {child.children.length > 0 ? (
            <ul className="mt-1.5 space-y-1 px-1">
              {child.children.map((grandchild) => (
                <li key={grandchild.id}>
                  <Link
                    className="block truncate text-xs text-zinc-500 transition hover:text-orange-600"
                    href={`/kategori/${grandchild.slug}`}
                    onClick={onNavigate}
                    title={grandchild.name}
                  >
                    {grandchild.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SiteNav({
  items,
  categories,
}: {
  items: MenuNavItem[];
  categories: CategoryNode[];
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [activeTopId, setActiveTopId] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openItem = items.find(
    (item) => item.id === openId && item.type === "categories"
  );
  const activeTop =
    categories.find((category) => category.id === activeTopId) ??
    categories[0] ??
    null;

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenId(null), 160);
  }

  function openMega(item: MenuNavItem) {
    cancelClose();
    setOpenId(item.id);
    setActiveTopId((current) => current ?? categories[0]?.id ?? null);
  }

  function closeMega() {
    cancelClose();
    setOpenId(null);
  }

  return (
    <div
      className="relative border-t border-zinc-100 bg-zinc-50"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpenId(null);
          setMobileOpen(false);
        }
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:hidden">
        <button
          aria-controls="mobile-menu"
          aria-expanded={mobileOpen}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
          onClick={() => setMobileOpen((current) => !current)}
          type="button"
        >
          <Hamburger open={mobileOpen} />
          Menü
        </button>
        <Link
          className="text-xs font-semibold text-zinc-500 transition hover:text-orange-600"
          href="/urunler"
          onClick={() => setMobileOpen(false)}
        >
          Tüm Ürünler
        </Link>
      </div>

      <div
        className="relative hidden md:block"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-0.5 px-4">
          {items.map((item) =>
            item.type === "categories" ? (
              <Link
                aria-expanded={openId === item.id}
                aria-haspopup="true"
                className="flex items-center gap-1 whitespace-nowrap px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:text-orange-600 focus:text-orange-600 focus:outline-none"
                href={item.href}
                key={item.id}
                onClick={() => setOpenId(null)}
                onFocus={() => openMega(item)}
                onMouseEnter={() => openMega(item)}
              >
                {item.label}
                <Chevron open={openId === item.id} />
              </Link>
            ) : (
              <Link
                className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:text-orange-600"
                href={item.href}
                key={item.id}
                onFocus={closeMega}
                onMouseEnter={closeMega}
                rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                target={item.open_in_new_tab ? "_blank" : undefined}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {openItem ? (
          <div className="absolute inset-x-0 top-full z-50 border-t border-zinc-200 bg-white shadow-xl">
            <div className="mx-auto max-w-7xl px-4 py-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Ürün Kategorileri
                </p>
                <Link
                  className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700"
                  href="/urunler"
                  onClick={() => setOpenId(null)}
                >
                  Tüm Ürünler
                </Link>
              </div>

              {categories.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  Henüz kategori bulunmuyor.
                </p>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                  <div className="max-h-[55vh] space-y-1 overflow-y-auto pr-2">
                    {categories.map((category) => (
                      <Link
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                          activeTop?.id === category.id
                            ? "bg-orange-50 text-orange-700"
                            : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                        href={`/kategori/${category.slug}`}
                        key={category.id}
                        onClick={() => setOpenId(null)}
                        onFocus={() => setActiveTopId(category.id)}
                        onMouseEnter={() => setActiveTopId(category.id)}
                      >
                        <span className="truncate">{category.name}</span>
                        {category.children.length > 0 ? (
                          <span className="ml-2 shrink-0 text-[11px] text-zinc-400">
                            {category.children.length}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>

                  <div className="min-w-0">
                    {activeTop ? (
                      <>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <Link
                            className="text-base font-bold text-zinc-900 transition hover:text-orange-600"
                            href={`/kategori/${activeTop.slug}`}
                            onClick={() => setOpenId(null)}
                          >
                            {activeTop.name}
                          </Link>
                          <Link
                            className="text-xs font-semibold text-orange-600 transition hover:text-orange-700"
                            href={`/kategori/${activeTop.slug}`}
                            onClick={() => setOpenId(null)}
                          >
                            Tümünü gör
                          </Link>
                        </div>
                        <CategoryChildren
                          category={activeTop}
                          onNavigate={() => setOpenId(null)}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="border-t border-zinc-200 bg-white md:hidden" id="mobile-menu">
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {items.map((item) =>
              item.type === "categories" ? (
                <details className="group" key={item.id}>
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
                    {item.label}
                    <Chevron />
                  </summary>
                  <div className="mt-1 space-y-1 border-l border-zinc-200 pl-3">
                    <Link
                      className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                      href="/urunler"
                      onClick={() => setMobileOpen(false)}
                    >
                      Tüm Ürünler
                    </Link>
                    {categories.map((category) => (
                      <details className="group" key={category.id}>
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
                          {category.name}
                          {category.children.length > 0 ? <Chevron /> : null}
                        </summary>
                        {category.children.length > 0 ? (
                          <div className="ml-3 border-l border-zinc-200 pl-3">
                            {category.children.map((child) => (
                              <Link
                                className="block rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
                                href={`/kategori/${child.slug}`}
                                key={child.id}
                                onClick={() => setMobileOpen(false)}
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </details>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                  href={item.href}
                  key={item.id}
                  onClick={() => setMobileOpen(false)}
                  rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                  target={item.open_in_new_tab ? "_blank" : undefined}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
