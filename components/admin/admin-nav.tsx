"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/menu", label: "Menü" },
  { href: "/admin/sayfalar", label: "Sayfalar" },
  { href: "/admin/slider", label: "Slider" },
  { href: "/admin/siparisler", label: "Siparişler" },
  { href: "/admin/uyeler", label: "Üyeler" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-2 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-orange-50 text-orange-700"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
