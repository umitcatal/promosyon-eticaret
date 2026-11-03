import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";

export type CategoryCard = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  childCount?: number;
};

function ordinal(position: number): string {
  return String(position + 1).padStart(2, "0");
}

export function CategoryIndex({ categories }: { categories: CategoryCard[] }) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((category, position) => (
        <li key={category.id}>
          <Link
            className="group flex h-full flex-col overflow-hidden rounded-sm border border-line bg-paper transition-[border-color,box-shadow] duration-500 ease-out hover:border-ink/30 hover:shadow-[0_24px_50px_-32px_rgba(20,19,15,0.45)]"
            href={`/kategori/${category.slug}`}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-surface transition-colors duration-500 group-hover:bg-surface/70">
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border border-line-strong bg-paper/90 text-[12px] text-ink-muted backdrop-blur-sm transition-all duration-300 ease-out group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-paper"
              >
                →
              </span>
              <ProductImage
                alt={category.name}
                className="object-contain p-4 mix-blend-multiply transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                sizes="(max-width: 1023px) 50vw, 25vw"
                src={category.image}
                unoptimized={category.image?.startsWith("http")}
              />
            </div>
            <div className="flex-1 border-t border-line px-4 pt-3.5 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                {category.childCount
                  ? `${category.childCount} alt grup`
                  : "Koleksiyon"}
              </p>
              <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] leading-snug font-semibold text-ink transition-colors group-hover:text-brand-700 sm:text-[16px]">
                {category.name}
              </h3>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
