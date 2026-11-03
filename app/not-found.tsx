import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
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
        </div>
      </main>
      <Footer />
    </>
  );
}
