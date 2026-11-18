import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Sayfa bulunamadı",
  description: "Aradığınız sayfa bulunamadı.",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <p className="eyebrow">Kayıt bulunamadı</p>
          <p className="mt-4 font-display text-7xl leading-none font-semibold text-ink/15">
            404
          </p>
          <h1 className="mt-6 font-display text-2xl font-semibold text-ink sm:text-3xl">
            Aradığınız sayfa bulunamadı
          </h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-ink-muted">
            Sayfa kaldırılmış veya adresi değişmiş olabilir. Ana sayfadan
            kategorilere göz atabilirsiniz.
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-3 rounded-sm bg-brand-600 px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-brand-700"
            href="/"
          >
            Ana Sayfaya Dön
            <span aria-hidden="true">→</span>
          </Link>
        </main>
      </body>
    </html>
  );
}
