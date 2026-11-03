import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  Breadcrumb,
  CatalogHeading,
  type Crumb,
} from "@/components/catalog/catalog-chrome";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { getCategoryBySlug, getProductsByCategorySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) return { title: "Kategori bulunamadı" };

  return {
    title: `${data.category.name} Ürünleri`,
    description: `${data.category.name} kategorisindeki kurumsal promosyon ürünleri. Toplu alım ve logo baskı için teklif alın.`,
  };
}

type SearchParams = { sayfa?: string; sirala?: string };

function CategorySkeleton() {
  return (
    <div>
      <div className="h-3 w-56 animate-pulse rounded-sm bg-surface" />
      <div className="mt-5 h-10 w-72 animate-pulse rounded-sm bg-surface" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="aspect-[3/4] animate-pulse rounded-sm border border-line bg-surface/60"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

async function CategoryContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const data = await getCategoryBySlug(slug);
  if (!data) notFound();

  const page = Number(query.sayfa ?? "1") || 1;
  const sort = query.sirala ?? "newest";
  const products = await getProductsByCategorySlug(slug, { page, sort });
  if (!products) notFound();

  const { category, parent, children } = data;
  const paginationQuery: Record<string, string> = {};
  if (sort !== "newest") paginationQuery.sirala = sort;

  const crumbs: Crumb[] = [
    { href: "/", label: "Ana Sayfa" },
    ...(parent ? [{ href: `/kategori/${parent.slug}`, label: parent.name }] : []),
    { label: category.name },
  ];

  return (
    <div>
      <Breadcrumb items={crumbs} />

      <div className="mt-7">
        <CatalogHeading
          aside={<SortSelect value={sort} />}
          eyebrow={parent ? parent.name : "Koleksiyon"}
          meta={`${products.total} ürün · sayfa ${String(products.page).padStart(2, "0")}`}
          title={category.name}
        />
      </div>

      {children.length > 0 ? (
        <div className="border-b border-line pb-7">
          <p className="eyebrow">Alt gruplar</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {children.map((child) => (
              <Link
                className="rounded-sm border border-line bg-paper px-3.5 py-2 text-sm text-ink-muted transition-colors hover:border-ink hover:text-ink"
                href={`/kategori/${child.slug}`}
                key={child.id}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <ProductGrid products={products.items} />
      </div>

      <Pagination
        basePath={`/kategori/${category.slug}`}
        page={products.page}
        pageSize={products.pageSize}
        query={paginationQuery}
        total={products.total}
      />
    </div>
  );
}

export default function CategoryPage(props: PageProps<"/kategori/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryContent
          params={props.params}
          searchParams={props.searchParams}
        />
      </Suspense>
    </div>
  );
}
