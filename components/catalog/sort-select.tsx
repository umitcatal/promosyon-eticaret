"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "newest", label: "En Yeniler" },
  { value: "name", label: "İsme Göre" },
  { value: "price_asc", label: "Fiyat: Artan" },
  { value: "price_desc", label: "Fiyat: Azalan" },
];

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
        Sırala
      </span>
      <div className="relative">
        <select
          aria-label="Sıralama"
          className="appearance-none rounded-sm border border-line bg-paper py-2 pr-9 pl-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink outline-none transition-colors hover:border-line-strong focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          onChange={(event) => {
            const params = new URLSearchParams(searchParams.toString());
            if (event.target.value === "newest") params.delete("sirala");
            else params.set("sirala", event.target.value);
            params.delete("sayfa");
            const qs = params.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
          }}
          value={value}
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-ink-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
