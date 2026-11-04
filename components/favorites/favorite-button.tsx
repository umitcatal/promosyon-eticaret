"use client";

import { useFavorites } from "./favorites-provider";

export function FavoriteButton({
  productId,
  className = "",
  size = "md",
  showLabel = false,
}: {
  productId: number;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const { ready, isFavorite, isPending, toggle } = useFavorites();
  const active = isFavorite(productId);
  const pending = isPending(productId);

  return (
    <button
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 rounded-sm border border-line bg-paper/90 text-ink-muted backdrop-blur transition-colors hover:border-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 ${
        showLabel
          ? "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
          : size === "sm"
            ? "size-8"
            : "size-9"
      } ${active ? "text-brand-700" : ""} ${className}`}
      disabled={!ready || pending}
      onClick={() => {
        void toggle(productId);
      }}
      type="button"
    >
      <svg
        aria-hidden="true"
        className={size === "sm" && !showLabel ? "size-[15px]" : "size-[18px]"}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showLabel ? (
        <span>{active ? "Favorilerde" : "Favorilere Ekle"}</span>
      ) : null}
    </button>
  );
}
