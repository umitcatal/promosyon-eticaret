import { Suspense } from "react";
import { CatalogHeading } from "@/components/catalog/catalog-chrome";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { searchProducts } from "@/lib/queries";

function SearchSkeleton() {
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

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  const page = Number(query.sayfa ?? "1") || 1;
  const results = await searchProducts(q, { page });
  const searching = q.trim().length >= 2;

  return (
    <div>
      <CatalogHeading
        eyebrow="Arama"
        meta={
          searching
            ? `${results.total} sonuç · sayfa ${String(results.page).padStart(2, "0")}`
            : "en az 2 karakter"
        }
        title={searching ? `\u201C${q.trim()}\u201D` : "Ürün Ara"}
      />

      {searching ? (
        <>
          <div className="mt-8">
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
      ) : (
        <p className="mt-8 max-w-lg text-sm leading-7 text-ink-muted">
          Ürün adı, ürün kodu veya etiketlerle arayabilirsiniz. En az 2 karakter
          girin.
        </p>
      )}
    </div>
  );
}

export default function SearchPage(props: PageProps<"/arama">) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
