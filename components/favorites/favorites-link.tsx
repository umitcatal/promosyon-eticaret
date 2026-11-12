"use client";

import Link from "next/link";
import { useFavorites } from "./favorites-provider";

export function FavoritesLink() {
  const { count } = useFavorites();

  return (
    <Link
      aria-label="Favorilerim"
      className="relative flex size-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700"
      href="/hesabim/favoriler"
    >
      <svg
        aria-hidden="true"
        className="size-[18px]"
        fill={count > 0 ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-brand-600 px-1 font-mono text-[10px] font-semibold text-paper">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
