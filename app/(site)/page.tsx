import Link from "next/link";
import {
  CategoryIndex,
  type CategoryCard,
} from "@/components/catalog/category-index";
import {
  ProductGrid,
  ProductLedger,
} from "@/components/catalog/product-card";
import { HeroFallback, Slider } from "@/components/catalog/slider";
import { Reveal } from "@/components/motion/reveal";
import {
  getCategoryCardImage,
  getFeaturedProducts,
  getHomeCategoryTree,
  getNewProducts,
  getSliderItems,
} from "@/lib/queries";

const PROCESS = [
  {
    title: "Kurumsal Baskı",
    description: "Ürünlerinize şirket logonuzu ve özel tasarımlarınızı uygularız.",
  },
  {
    title: "Geniş Ürün Yelpazesi",
    description: "Kalemden teknolojiye 500'den fazla promosyon ürünü.",
  },
  {
    title: "Teklif Odaklı Süreç",
    description: "Siparişiniz sonrası ekibimiz ihtiyaçlarınıza özel fiyat iletir.",
  },
  {
    title: "Hızlı Tedarik",
    description: "Stoktan ve üretimden hızlı sevkiyat seçenekleri.",
  },
];

export default async function HomePage() {
  const [slides, homeCategories, featured, newArrivals] = await Promise.all([
    getSliderItems(),
    getHomeCategoryTree(),
    getFeaturedProducts(8),
    getNewProducts(6),
  ]);

  const categoryCards: CategoryCard[] = await Promise.all(
    homeCategories.map(async (top) => ({
      id: top.id,
      name: top.name,
      slug: top.slug,
      childCount: top.children.length,
      image:
        top.image_url ??
        (await getCategoryCardImage([
          top.id,
          ...top.children.map((child) => child.id),
        ])),
    }))
  );

  return (
    <div className="flex-1">
      <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:pt-6">
        {slides.length > 0 ? <Slider slides={slides} /> : <HeroFallback />}
      </section>

      {categoryCards.length > 0 ? (
        <Reveal className="mx-auto w-full max-w-7xl px-4">
          <section className="mt-16 sm:mt-24" id="kategoriler">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <p className="eyebrow">Bölüm 01 — Koleksiyon</p>
                <h2 className="mt-3 font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  Ürün Grupları
                </h2>
              </div>
            </div>
            <div className="mt-8">
              <CategoryIndex categories={categoryCards} />
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal className="mx-auto w-full max-w-7xl px-4">
        <section className="mt-20 sm:mt-28">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <p className="eyebrow">Bölüm 02 — Seçki</p>
              <h2 className="mt-3 font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Öne Çıkan Ürünler
              </h2>
            </div>
            <Link
              className="group inline-flex items-center gap-2 border-b border-line-strong pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700"
              href="/urunler"
            >
              Tüm Ürünler
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-20 border-y border-line-strong bg-ink sm:mt-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:py-18 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16 lg:py-20">
            <div>
              <p className="eyebrow text-brass-300">Nasıl çalışır</p>
              <h2 className="mt-4 font-display text-3xl leading-[1.05] font-semibold text-paper sm:text-4xl">
                Tekliften
                <span className="block text-brass-200 italic">teslime</span>
                temiz bir süreç.
              </h2>
            </div>
            <ol className="grid gap-px bg-line/15 sm:grid-cols-2">
              {PROCESS.map((step, index) => (
                <li className="bg-ink px-1 py-6 sm:px-4" key={step.title}>
                  <span className="font-display text-4xl leading-none font-semibold text-brand-300/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-paper">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-paper/65">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </Reveal>

      <Reveal className="mx-auto w-full max-w-7xl px-4">
        <section className="mt-20 grid gap-8 sm:mt-28 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Bölüm 03 — Stok</p>
            <h2 className="mt-3 font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl">
              Yeni Gelenler
            </h2>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Kataloğa eklenen son ürünler. Fiyatlar teklif bazlıdır; ürün
              kodunu belirterek ekibimizden fiyat isteyebilirsiniz.
            </p>
          </div>
          <ProductLedger products={newArrivals} />
        </section>
      </Reveal>
    </div>
  );
}
