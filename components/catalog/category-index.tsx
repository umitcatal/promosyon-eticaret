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
    <ol className="group/index grid gap-x-10 sm:grid-cols-2">
      {categories.map((category, position) => (
        <li className="border-t border-line" key={category.id}>
          <Link
            className="group/row relative flex items-center gap-4 py-5 transition-opacity duration-500 ease-out sm:group-hover/index:opacity-40 sm:group-hover/row:opacity-100! lg:pr-32"
            href={`/kategori/${category.slug}`}
          >
            <span className="w-6 shrink-0 font-mono text-[11px] tracking-[0.16em] text-brass-600">
              {ordinal(position)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg font-semibold text-ink decoration-line-strong decoration-1 underline-offset-[6px] transition-colors group-hover/row:text-brand-700 group-hover/row:underline sm:text-[1.4rem]">
                {category.name}
              </span>
              {category.childCount ? (
                <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  {category.childCount} alt grup
                </span>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-ink-muted transition-all duration-500 ease-out group-hover/row:translate-x-1 group-hover/row:text-brand-600"
            >
              →
            </span>
            {category.image ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-14 top-1/2 hidden size-24 -translate-y-1/2 scale-[0.92] overflow-hidden rounded-sm border border-line bg-surface opacity-0 shadow-[0_18px_40px_-24px_rgba(20,19,15,0.45)] transition-all duration-500 ease-out group-hover/row:scale-100 group-hover/row:opacity-100 lg:block"
              >
                <ProductImage
                  alt={category.name}
                  className="object-contain p-2 mix-blend-multiply"
                  fallbackClassName="hidden"
                  sizes="96px"
                  src={category.image}
                  unoptimized={category.image.startsWith("http")}
                />
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}
