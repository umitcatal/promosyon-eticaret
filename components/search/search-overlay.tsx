"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  MAX_SEARCH_QUERY_LENGTH,
  normalizeSearchQuery,
} from "@/lib/search-fold";
import { useSearch } from "./search-provider";
import { SearchResults } from "./search-results";

function SearchIcon() {
  return (
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
  );
}

function DesktopPanel() {
  const { query, normalizedQuery, closeSearch } = useSearch();

  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        aria-hidden="true"
        className="fixed inset-0 z-10 hidden bg-ink/25 backdrop-blur-[2px] lg:block"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={() => closeSearch()}
        transition={{ duration: 0.24 }}
      />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="search-scroll absolute inset-x-0 top-full z-30 hidden max-h-[min(82dvh,48rem)] overflow-y-auto overscroll-contain border-b border-line-strong bg-paper shadow-[0_28px_60px_-40px_rgba(20,19,15,0.5)] lg:block"
        exit={{ opacity: 0, y: -8 }}
        initial={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <p className="eyebrow">Arama</p>
            <div className="flex items-center gap-5">
              {normalizedQuery.length >= 2 ? (
                <p className="max-w-[42vw] truncate font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  “{query.trim()}”
                </p>
              ) : null}
              <button
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
                onClick={() => closeSearch({ restoreFocus: true })}
                type="button"
              >
                Kapat ×
              </button>
            </div>
          </div>
          <SearchResults variant="desktop" />
        </div>
      </motion.div>
    </>
  );
}

function MobileSheet() {
  const {
    query,
    setQuery,
    closeSearch,
    submitAll,
    activeKey,
    optionId,
    listboxId,
    handleInputKeyDown,
  } = useSearch();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      aria-label="Ürün ara"
      aria-modal="true"
      className="fixed inset-0 z-40 flex flex-col bg-paper lg:hidden"
      exit={{ opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: -8 }}
      role="dialog"
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <form
          action="/arama"
          className="min-w-0 flex-1"
          method="GET"
          onSubmit={(event) => {
            event.preventDefault();
            submitAll();
          }}
          role="search"
        >
          <div className="group relative flex items-center">
            <SearchIcon />
            <input
              aria-activedescendant={
                activeKey ? optionId(activeKey) : undefined
              }
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded="true"
              aria-label="Ürün ara"
              autoComplete="off"
              autoFocus
              className="w-full border-b border-line-strong bg-transparent py-1.5 pl-7 pr-8 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 group-focus-within:border-brand-600"
              enterKeyHint="search"
              maxLength={MAX_SEARCH_QUERY_LENGTH}
              name="q"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ürün, kategori veya kod ara"
              role="combobox"
              spellCheck={false}
              type="search"
              value={query}
            />
            {normalizeSearchQuery(query) ? (
              <button
                aria-label="Aramayı temizle"
                className="absolute right-0 font-mono text-sm text-ink-muted transition-colors hover:text-ink"
                onClick={() => setQuery("")}
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>
        </form>
        <button
          className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
          onClick={() => closeSearch({ restoreFocus: true })}
          type="button"
        >
          Kapat
        </button>
      </div>

      <div className="search-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SearchResults variant="mobile" />
      </div>
    </motion.div>
  );
}

export function SearchOverlay() {
  const { open, source } = useSearch();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && source === "desktop" ? <DesktopPanel key="desktop" /> : null}
        {open && source === "mobile" ? <MobileSheet key="mobile" /> : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
