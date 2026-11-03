import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogHeading } from "@/components/catalog/catalog-chrome";
import { CategorySidebar } from "@/components/catalog/category-sidebar";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { getAllProducts, getCategorySidebarTree } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description:
    "Kurumsal promosyon ürünlerinin tamamına göz atın. Toplu alım ve logo baskı için teklif alın.",
};

function ProductsSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="aspect-[3/4] animate-pulse rounded-sm border border-line bg-surface/60"
          key={index}
        />
      ))}
    </div>
  );
}

async function AllProductsContent({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string; sirala?: string }>;
}) {
  const query = await searchParams;
  const page = Number(query.sayfa ?? "1") || 1;
  const sort = query.sirala ?? "newest";
  const products = await getAllProducts({ page, sort });

  const paginationQuery: Record<string, string> = {};
  if (sort !== "newest") paginationQuery.sirala = sort;

  return (
    <div>
      <CatalogHeading
        aside={<SortSelect value={sort} />}
        eyebrow="Katalog"
        meta={`${products.total} ürün · sayfa ${String(products.page).padStart(2, "0")}`}
        title="Tüm Ürünler"
      />

      <div className="mt-8">
        <ProductGrid products={products.items} />
      </div>

      <Pagination
        basePath="/urunler"
        page={products.page}
        pageSize={products.pageSize}
        query={paginationQuery}
        total={products.total}
      />
    </div>
  );
}

export default async function AllProductsPage(props: PageProps<"/urunler">) {
  const sidebar = await getCategorySidebarTree();

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-12">
        <CategorySidebar
          activeSlug={null}
          nodes={sidebar.nodes}
          total={sidebar.total}
        />
        <div className="min-w-0">
          <Suspense fallback={<ProductsSkeleton />}>
            <AllProductsContent searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
