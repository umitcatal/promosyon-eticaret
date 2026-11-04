"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { MAX_SEARCH_QUERY_LENGTH, normalizeSearchQuery } from "@/lib/search-fold";
import { useSearch } from "./search-provider";

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

export function DesktopSearchTrigger({ className }: { className?: string }) {
  const {
    open,
    query,
    normalizedQuery,
    setQuery,
    openSearch,
    submitAll,
    activeKey,
    optionId,
    listboxId,
    handleInputKeyDown,
  } = useSearch();
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const isArrow =
      event.key === "ArrowDown" || event.key === "ArrowUp";
    if (isArrow && !open && normalizedQuery.length >= 2) {
      openSearch("desktop", inputRef.current);
    }
    handleInputKeyDown(event);
  }

  return (
    <form
      action="/arama"
      className={className}
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
          aria-expanded={open}
          aria-label="Ürün ara"
          autoComplete="off"
          className="w-full border-b border-line-strong bg-transparent py-1.5 pl-7 pr-8 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 group-focus-within:border-brand-600"
          maxLength={MAX_SEARCH_QUERY_LENGTH}
          name="q"
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (
              !open &&
              normalizeSearchQuery(next).length >= 2
            ) {
              openSearch("desktop", event.currentTarget);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="Ürün, kategori veya kod ara"
          ref={inputRef}
          role="combobox"
          spellCheck={false}
          type="search"
          value={query}
        />
      </div>
    </form>
  );
}

export function MobileSearchTrigger({ className }: { className?: string }) {
  const { open, query, openSearch } = useSearch();

  return (
    <Link
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label="Ürün ara"
      className={className}
      href="/arama"
      onClick={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        openSearch("mobile", event.currentTarget);
      }}
    >
      <span className="group relative flex items-center">
        <SearchIcon />
        <span
          className={`block w-full truncate border-b border-line-strong bg-transparent py-1.5 pl-7 pr-3 text-left font-display text-[15px] transition-colors group-focus-within:border-brand-600 ${
            query ? "text-ink" : "text-ink-muted/70"
          }`}
        >
          {query || "Ürün, kategori veya kod ara"}
        </span>
      </span>
    </Link>
  );
}
