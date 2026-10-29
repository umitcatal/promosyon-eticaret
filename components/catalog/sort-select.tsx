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
    <select
      aria-label="Sıralama"
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition focus:border-orange-500"
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
  );
}
