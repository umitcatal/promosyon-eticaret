"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Genel Bakış" },
  { href: "/admin/anasayfa", label: "Anasayfa" },
  { href: "/admin/slider", label: "Slider" },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/urunler/cop", label: "Silinen Ürünler" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/koleksiyonlar", label: "Koleksiyonlar" },
  { href: "/admin/referanslar", label: "Referanslar" },
  { href: "/admin/menu", label: "Menü" },
  { href: "/admin/sayfalar", label: "Sayfalar" },
  { href: "/admin/yonlendirmeler", label: "Yönlendirmeler" },
  { href: "/admin/siparisler", label: "Siparişler" },
  { href: "/admin/uyeler", label: "Üyeler" },
  { href: "/admin/tema", label: "Tema" },
  { href: "/admin/ayarlar", label: "Ayarlar" },
];

export function AdminNav() {
  const pathname = usePathname();
  const activeHref = NAV.reduce<string | null>((match, item) => {
    const matches =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href);
    if (!matches) return match;
    if (!match || item.href.length > match.length) return item.href;
    return match;
  }, null);

  return (
    <nav className="mt-2 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {NAV.map((item) => {
        const active = item.href === activeHref;
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
