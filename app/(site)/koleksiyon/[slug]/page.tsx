import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Breadcrumb,
  CatalogHeading,
  type Crumb,
} from "@/components/catalog/catalog-chrome";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import {
  getCollectionBySlug,
  getCollectionProductsBySlug,
} from "@/lib/queries";
import { isSafeSlug, openGraphBase } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  // Partial Prerender statik shell'i 200 ile gönderdiği için notFound() durum
  // kodunu değiştiremiyor; soft-404'ün indekslenmesini meta ile engelliyoruz.
  if (!collection) {
    return {
      title: "Koleksiyon bulunamadı",
      robots: { index: false, follow: true },
    };
  }

  const title = collection.name;
  const description =
    collection.description ||
    `${collection.name} koleksiyonundaki kurumsal promosyon ürünleri. Toplu alım ve logo baskı için teklif alın.`;
  const canonical = isSafeSlug(slug) ? `/koleksiyon/${slug}` : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      ...openGraphBase,
      title,
      description,
      url: canonical,
    },
  };
}

type SearchParams = { sayfa?: string };

function CollectionSkeleton() {
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

function CollectionPageSkeleton() {
  return (
    <div>
      <div className="h-3 w-64 animate-pulse rounded-sm bg-surface" />
      <div className="mt-7">
        <CollectionSkeleton />
      </div>
    </div>
  );
}

async function CollectionContent({
  searchParams,
  slug,
}: {
  searchParams: Promise<SearchParams>;
  slug: string;
}) {
  const query = await searchParams;
  const page = Number(query.sayfa ?? "1") || 1;
  const data = await getCollectionProductsBySlug(slug, { page });
  if (!data) notFound();

  return (
    <div>
      <CatalogHeading
        eyebrow="Koleksiyon"
        meta={`${data.total} ürün · sayfa ${String(data.page).padStart(2, "0")}`}
        title={data.collection.name}
      />

      <div className="mt-8">
        <ProductGrid
          emptyMessage="Bu koleksiyonda henüz ürün yok."
          products={data.items}
        />
      </div>

      <Pagination
        basePath={`/koleksiyon/${slug}`}
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
      />
    </div>
  );
}

async function CollectionPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const crumbs: Crumb[] = [
    { href: "/", label: "Ana Sayfa" },
    { label: collection.name },
  ];

  return (
    <>
      <Breadcrumb items={crumbs} />
      <div className="mt-7">
        <Suspense fallback={<CollectionSkeleton />}>
          <CollectionContent searchParams={searchParams} slug={slug} />
        </Suspense>
      </div>
    </>
  );
}

export default function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <Suspense fallback={<CollectionPageSkeleton />}>
        <CollectionPageContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
