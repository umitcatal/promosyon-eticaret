import { Suspense } from "react";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { searchProducts } from "@/lib/queries";

function SearchSkeleton() {
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

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const page = Number(query.sayfa ?? "1") || 1;
  const results = await searchProducts(q, { page });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        {q ? `"${q}" için arama sonuçları` : "Ürün Ara"}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {q.trim().length < 2
          ? "Aramak için en az 2 karakter yazın."
          : `${results.total} ürün bulundu`}
      </p>

      {q.trim().length >= 2 ? (
        <>
          <div className="mt-6">
            <ProductGrid products={results.items} />
          </div>
          <Pagination
            basePath="/arama"
            page={results.page}
            pageSize={results.pageSize}
            query={{ q }}
            total={results.total}
          />
        </>
      ) : null}
    </div>
  );
}

export default function SearchPage(props: PageProps<"/arama">) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
