import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <p className="text-6xl font-bold text-orange-600">404</p>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">
            Aradığınız sayfa bulunamadı
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Sayfa kaldırılmış veya adresi değişmiş olabilir. Ana sayfadan
            kategorilere göz atabilirsiniz.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
            href="/"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
