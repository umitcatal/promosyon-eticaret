import { Suspense } from "react";
import type { Metadata } from "next";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { getAllProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Tüm Ürünler",
  description:
    "Kurumsal promosyon ürünlerinin tamamına göz atın. Toplu alım ve logo baskı için teklif alın.",
};

function ProductsSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-100"
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Tüm Ürünler
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {products.total} ürün listeleniyor
          </p>
        </div>
        <SortSelect value={sort} />
      </div>

      <div className="mt-6">
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

export default function AllProductsPage(props: PageProps<"/urunler">) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Suspense fallback={<ProductsSkeleton />}>
        <AllProductsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
