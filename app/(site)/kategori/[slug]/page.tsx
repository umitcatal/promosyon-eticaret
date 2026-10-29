import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
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
      <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
      <div className="mt-4 h-8 w-64 animate-pulse rounded bg-zinc-100" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-100"
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

  return (
    <div>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link className="transition hover:text-orange-600" href="/">
          Ana Sayfa
        </Link>
        {parent ? (
          <>
            <span>/</span>
            <Link
              className="transition hover:text-orange-600"
              href={`/kategori/${parent.slug}`}
            >
              {parent.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="font-medium text-zinc-800">{category.name}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {category.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {products.total} ürün listeleniyor
          </p>
        </div>
        <SortSelect value={sort} />
      </div>

      {children.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-orange-300 hover:text-orange-700"
              href={`/kategori/${child.slug}`}
              key={child.id}
            >
              {child.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
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
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryContent
          params={props.params}
          searchParams={props.searchParams}
        />
      </Suspense>
    </div>
  );
}
