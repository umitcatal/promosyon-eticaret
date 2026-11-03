"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import type { CategoryNode, MenuNavItem } from "@/lib/types";

function ordinal(position: number): string {
  return String(position + 1).padStart(2, "0");
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
      <p className="mt-6 border-t border-line pt-6 font-display text-lg text-ink-muted">
        Bu grup tek ürün altından oluşuyor.
      </p>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-px border-t border-line bg-line/60 pt-px sm:grid-cols-3 xl:grid-cols-4">
      {category.children.map((child) => (
        <div className="bg-paper" key={child.id}>
          <Link
            className="group flex h-full flex-col gap-3 p-3 transition-colors hover:bg-surface/70"
            href={`/kategori/${child.slug}`}
            onClick={onNavigate}
          >
            <span className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-line bg-surface/50">
              <ProductImage
                alt={child.name}
                className="object-contain p-3 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                fallbackClassName="flex h-full w-full items-center justify-center bg-surface font-display text-3xl font-semibold text-brass-300"
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                src={child.image_url}
                unoptimized={child.image_url?.startsWith("http") ?? false}
              />
            </span>
            <span className="line-clamp-2 font-display text-[15px] leading-snug font-semibold text-ink decoration-line-strong decoration-1 underline-offset-4 group-hover:underline">
              {child.name}
            </span>
            {child.children.length > 0 ? (
              <span className="mt-auto font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                {child.children.length} alt grup
              </span>
            ) : null}
          </Link>
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openTopId, setOpenTopId] = useState<number | null>(null);
  const [menuGroupsOpen, setMenuGroupsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

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

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  function dismissAll() {
    closeMega();
    if (drawerOpen) closeDrawer();
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  return (
    <div
      className="relative border-t border-line"
      onKeyDown={(event) => {
        if (event.key === "Escape") dismissAll();
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:hidden">
        <button
          aria-controls="mobile-menu"
          aria-expanded={drawerOpen}
          className="inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink"
          onClick={() => setDrawerOpen((current) => !current)}
          ref={menuButtonRef}
          type="button"
        >
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block h-px w-5 bg-ink" />
            <span className="block h-px w-5 bg-ink" />
          </span>
          Menü
        </button>
        <Link
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:text-brand-700"
          href="/urunler"
        >
          Tüm Ürünler →
        </Link>
      </div>

      <div
        className="relative hidden md:block"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {items.map((item) =>
            item.type === "categories" ? (
              <Link
                aria-expanded={openId === item.id}
                aria-haspopup="true"
                className={`group relative px-3 py-3 text-[13px] font-medium tracking-wide transition-colors focus:outline-none ${
                  openId === item.id
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink focus:text-ink"
                }`}
                href={item.href}
                key={item.id}
                onClick={() => setOpenId(null)}
                onFocus={() => openMega(item)}
                onMouseEnter={() => openMega(item)}
              >
                {item.label}
                <span
                  className={`absolute inset-x-3 bottom-2 h-px origin-left bg-brass-500 transition-transform duration-300 ease-out ${
                    openId === item.id
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                  }`}
                />
              </Link>
            ) : (
              <Link
                className="group relative px-3 py-3 text-[13px] font-medium tracking-wide text-ink-muted transition-colors hover:text-ink"
                href={item.href}
                key={item.id}
                onFocus={closeMega}
                onMouseEnter={closeMega}
                rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                target={item.open_in_new_tab ? "_blank" : undefined}
              >
                {item.label}
                <span className="absolute inset-x-3 bottom-2 h-px origin-left scale-x-0 bg-brass-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            )
          )}
        </div>

        <AnimatePresence>
          {openItem ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 top-full z-50 border-b border-line-strong bg-paper shadow-[0_28px_60px_-40px_rgba(20,19,15,0.5)]"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              key={openItem.id}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="eyebrow">Ürün Grupları</p>
                  <Link
                    className="border-b border-line-strong pb-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700"
                    href="/urunler"
                    onClick={() => setOpenId(null)}
                  >
                    Tüm Ürünler →
                  </Link>
                </div>

                {categories.length === 0 ? (
                  <p className="py-8 text-sm text-ink-muted">
                    Henüz kategori bulunmuyor.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-8 lg:grid-cols-[248px_1fr]">
                    <ol className="max-h-[54vh] overflow-y-auto border-t border-line pr-2">
                      {categories.map((category, position) => (
                        <li className="border-b border-line/70" key={category.id}>
                          <Link
                            className={`flex items-baseline gap-3 py-2.5 text-sm transition-colors ${
                              activeTop?.id === category.id
                                ? "text-brand-700"
                                : "text-ink-muted hover:text-ink"
                            }`}
                            href={`/kategori/${category.slug}`}
                            onClick={() => setOpenId(null)}
                            onFocus={() => setActiveTopId(category.id)}
                            onMouseEnter={() => setActiveTopId(category.id)}
                          >
                            <span className="w-5 shrink-0 font-mono text-[10px] tracking-[0.12em] text-brass-600">
                              {ordinal(position)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-display font-semibold">
                              {category.name}
                            </span>
                            {category.children.length > 0 ? (
                              <span className="shrink-0 font-mono text-[10px] text-ink-muted">
                                {category.children.length}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ol>

                    <div className="min-w-0">
                      {activeTop ? (
                        <>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                            <Link
                              className="font-display text-2xl font-semibold text-ink transition-colors hover:text-brand-700"
                              href={`/kategori/${activeTop.slug}`}
                              onClick={() => setOpenId(null)}
                            >
                              {activeTop.name}
                            </Link>
                            <Link
                              className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-600 transition-colors hover:text-brand-700"
                              href={`/kategori/${activeTop.slug}`}
                              onClick={() => setOpenId(null)}
                            >
                              Grubu gör →
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden" id="mobile-menu">
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-ink/45"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={closeDrawer}
              transition={{ duration: 0.24 }}
            />
            <motion.div
              animate={{ x: 0 }}
              className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col border-r border-line-strong bg-paper"
              exit={{ x: "-100%" }}
              initial={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="eyebrow">Menü</span>
                <button
                  aria-label="Menüyü kapat"
                  autoFocus
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
                  onClick={closeDrawer}
                  type="button"
                >
                  Kapat ×
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-3">
                <ul className="border-t border-line">
                  {items.map((item) =>
                    item.type === "categories" ? (
                      <li className="border-b border-line" key={item.id}>
                        <div className="flex items-center justify-between gap-3 py-3">
                          <Link
                            className="font-display text-lg font-semibold text-ink"
                            href={item.href}
                            onClick={() => setDrawerOpen(false)}
                          >
                            {item.label}
                          </Link>
                          <button
                            aria-expanded={menuGroupsOpen}
                            aria-label={`${item.label} kategorilerini aç`}
                            className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted"
                            onClick={() =>
                              setMenuGroupsOpen((current) => !current)
                            }
                            type="button"
                          >
                            {menuGroupsOpen ? "Gizle −" : "Aç +"}
                          </button>
                        </div>
                        <div
                          className={`grid transition-all duration-300 ease-out ${
                            menuGroupsOpen
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <ul className="mb-3 border-l border-line pl-4">
                              {categories.map((category) => (
                                <li key={category.id}>
                                  <div className="flex items-center justify-between gap-3">
                                    <Link
                                      className="block py-2 text-sm text-ink-muted transition-colors hover:text-brand-700"
                                      href={`/kategori/${category.slug}`}
                                      onClick={() => setDrawerOpen(false)}
                                    >
                                      {category.name}
                                    </Link>
                                    {category.children.length > 0 ? (
                                      <button
                                        aria-label={`${category.name} alt gruplarını aç`}
                                        className="font-mono text-[10px] text-brass-600"
                                        onClick={() =>
                                          setOpenTopId((current) =>
                                            current === category.id
                                              ? null
                                              : category.id
                                          )
                                        }
                                        type="button"
                                      >
                                        {openTopId === category.id
                                          ? "−"
                                          : "+"}
                                      </button>
                                    ) : null}
                                  </div>
                                  <div
                                    className={`grid transition-all duration-300 ease-out ${
                                      openTopId === category.id
                                        ? "grid-rows-[1fr] opacity-100"
                                        : "grid-rows-[0fr] opacity-0"
                                    }`}
                                  >
                                    <div className="overflow-hidden">
                                      <ul className="mb-2 ml-4 border-l border-line pl-3">
                                        {category.children.map((child) => (
                                          <li key={child.id}>
                                            <Link
                                              className="block py-1.5 text-sm text-ink-muted transition-colors hover:text-brand-700"
                                              href={`/kategori/${child.slug}`}
                                              onClick={() =>
                                                setDrawerOpen(false)
                                              }
                                            >
                                              {child.name}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </li>
                    ) : (
                      <li className="border-b border-line" key={item.id}>
                        <Link
                          className="block py-3 font-display text-lg font-semibold text-ink"
                          href={item.href}
                          onClick={() => setDrawerOpen(false)}
                          rel={
                            item.open_in_new_tab
                              ? "noopener noreferrer"
                              : undefined
                          }
                          target={item.open_in_new_tab ? "_blank" : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </nav>

              <div className="border-t border-line px-4 py-3">
                <Link
                  className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-ink"
                  href="/urunler"
                  onClick={() => setDrawerOpen(false)}
                >
                  Tüm Ürünler
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
