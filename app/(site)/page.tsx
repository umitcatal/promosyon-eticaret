import {
  CategoryGrid,
  type CategoryCard,
} from "@/components/catalog/category-grid";
import { ProductGrid } from "@/components/catalog/product-card";
import { HeroFallback, Slider } from "@/components/catalog/slider";
import {
  getCategoryCardImage,
  getCategoryTree,
  getFeaturedProducts,
  getSliderItems,
} from "@/lib/queries";

const FEATURES = [
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
  const [slides, tree, featured] = await Promise.all([
    getSliderItems(),
    getCategoryTree(),
    getFeaturedProducts(8),
  ]);

  const categoryCards: CategoryCard[] = await Promise.all(
    tree.slice(0, 8).map(async (top) => ({
      id: top.id,
      name: top.name,
      slug: top.slug,
      image:
        top.image_url ??
        (await getCategoryCardImage([
          top.id,
          ...top.children.map((child) => child.id),
        ])),
    }))
  );

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      {slides.length > 0 ? <Slider slides={slides} /> : <HeroFallback />}

      <section className="mt-10" id="kategoriler">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Kategoriler
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Promosyon ürün gruplarına göz atın
            </p>
          </div>
        </div>
        <div className="mt-5">
          <CategoryGrid categories={categoryCards} />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Öne Çıkan Ürünler
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              En çok tercih edilen promosyon ürünleri
            </p>
          </div>
        </div>
        <div className="mt-5">
          <ProductGrid products={featured} />
        </div>
      </section>

      <section className="mt-12 grid gap-4 rounded-2xl bg-zinc-50 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title}>
            <p className="text-sm font-bold text-zinc-900">{feature.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
