import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";

export type CategoryCard = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
};

export function CategoryGrid({ categories }: { categories: CategoryCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
          href={`/kategori/${category.slug}`}
          key={category.id}
        >
          <div className="relative aspect-[4/3] w-full bg-zinc-50">
            <ProductImage
              alt={category.name}
              className="object-contain p-4 transition duration-300 group-hover:scale-105"
              fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-zinc-100 text-3xl font-bold text-orange-200"
              fallbackLabel={category.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={category.image}
              unoptimized={category.image?.startsWith("http")}
            />
          </div>
          <div className="border-t border-zinc-100 px-4 py-3">
            <p className="line-clamp-2 text-sm font-semibold text-zinc-800 transition group-hover:text-orange-700">
              {category.name}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
