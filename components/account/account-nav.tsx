"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  orderCount: number;
  favoriteCount: number;
  isAdmin: boolean;
};

export function AccountNav({ orderCount, favoriteCount, isAdmin }: Props) {
  const pathname = usePathname();

  const items = [
    { href: "/hesabim", label: "Genel Bakış" },
    { href: "/hesabim/siparisler", label: `Siparişlerim (${orderCount})` },
    { href: "/hesabim/favoriler", label: `Favorilerim (${favoriteCount})` },
  ];

  return (
    <nav className="mt-5 space-y-1 border-t border-zinc-100 pt-4 text-sm">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            className={`block rounded-lg px-3 py-2 transition ${
              active
                ? "bg-orange-50 font-semibold text-orange-700"
                : "text-zinc-700 hover:bg-zinc-50"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
      {isAdmin ? (
        <Link
          className="block rounded-lg px-3 py-2 font-semibold text-orange-700 transition hover:bg-zinc-50"
          href="/admin"
        >
          Yönetim Paneli
        </Link>
      ) : null}
    </nav>
  );
}
