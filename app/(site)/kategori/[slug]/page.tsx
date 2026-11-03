import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  Breadcrumb,
  CatalogHeading,
  type Crumb,
} from "@/components/catalog/catalog-chrome";
import { CategorySidebar } from "@/components/catalog/category-sidebar";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import {
  getCategoryBySlug,
  getCategorySidebarTree,
  getProductsByCategorySlug,
} from "@/lib/queries";
import type { Category } from "@/lib/types";

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

function CategoryPageSkeleton() {
  return (
    <div>
      <div className="h-3 w-64 animate-pulse rounded-sm bg-surface" />
      <div className="mt-7 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-12">
        <div className="mb-8 border-b-2 border-line pb-3 lg:mb-0">
          <div className="h-3 w-32 animate-pulse rounded-sm bg-surface" />
        </div>
        <div className="min-w-0">
          <CategorySkeleton />
        </div>
      </div>
    </div>
  );
}

async function CategoryContent({
  category,
  parent,
  searchParams,
}: {
  category: Category;
  parent: Category | null;
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const page = Number(query.sayfa ?? "1") || 1;
  const sort = query.sirala ?? "newest";
  const products = await getProductsByCategorySlug(category.slug, { page, sort });
  if (!products) notFound();

  const paginationQuery: Record<string, string> = {};
  if (sort !== "newest") paginationQuery.sirala = sort;

  return (
    <div>
      <CatalogHeading
        aside={<SortSelect value={sort} />}
        eyebrow={parent ? parent.name : "Koleksiyon"}
        meta={`${products.total} ürün · sayfa ${String(products.page).padStart(2, "0")}`}
        title={category.name}
      />

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

async function CategoryPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const [data, sidebar] = await Promise.all([
    getCategoryBySlug(slug),
    getCategorySidebarTree(),
  ]);
  if (!data) notFound();

  const { category, parent } = data;
  const crumbs: Crumb[] = [
    { href: "/", label: "Ana Sayfa" },
    ...(parent ? [{ href: `/kategori/${parent.slug}`, label: parent.name }] : []),
    { label: category.name },
  ];

  return (
    <>
      <Breadcrumb items={crumbs} />

      <div className="mt-7 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-12">
        <CategorySidebar
          activeSlug={category.slug}
          nodes={sidebar.nodes}
          total={sidebar.total}
        />
        <div className="min-w-0">
          <Suspense fallback={<CategorySkeleton />}>
            <CategoryContent
              category={category}
              parent={parent}
              searchParams={searchParams}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default function CategoryPage(
  props: PageProps<"/kategori/[slug]">
) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <Suspense fallback={<CategoryPageSkeleton />}>
        <CategoryPageContent
          params={props.params}
          searchParams={props.searchParams}
        />
      </Suspense>
    </div>
  );
}
