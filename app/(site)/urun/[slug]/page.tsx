import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  ProductDetail,
  type ProductDetailVariant,
} from "@/components/catalog/product-detail";
import { descriptionToText, parseImages } from "@/lib/format";
import { getProductBySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Ürün bulunamadı" };

  const description =
    descriptionToText(data.product.description).slice(0, 160) ||
    `${data.product.name} - kurumsal promosyon ürünü.`;
  const firstVariantImage = data.variants
    .flatMap((variant) => parseImages(variant.images))
    .at(0);

  return {
    title: data.product.name,
    description,
    openGraph: {
      title: data.product.name,
      description,
      images: firstVariantImage ? [firstVariantImage] : undefined,
    },
  };
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="aspect-square animate-pulse rounded-2xl bg-zinc-100" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-100" />
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-12 w-full animate-pulse rounded bg-zinc-100" />
        <div className="h-24 w-full animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}

async function ProductContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();

  const { product, variants, category, parent } = data;

  const detailVariants: ProductDetailVariant[] = variants.map((variant) => ({
    id: variant.id,
    name: variant.attr_name || product.name,
    images: parseImages(variant.images),
    price: variant.price,
    stock: variant.stock,
  }));

  const description = descriptionToText(product.description);
  const printPricesHtml = product.baski_fiyatlari ?? "";
  const hasPrintPrices = printPricesHtml.includes("<img");
  const tags = (product.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

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
        {category ? (
          <>
            <span>/</span>
            <Link
              className="transition hover:text-orange-600"
              href={`/kategori/${category.slug}`}
            >
              {category.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="line-clamp-1 font-medium text-zinc-800">
          {product.name}
        </span>
      </nav>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {product.name}
        </h1>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
          Ürün Kodu: {product.code}
        </span>
      </div>

      <div className="mt-8">
        <ProductDetail productName={product.name} variants={detailVariants} />
      </div>

      {description ? (
        <section className="mt-10 border-t border-zinc-200 pt-8">
          <h2 className="text-lg font-bold text-zinc-900">Ürün Açıklaması</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-zinc-600">
            {description}
          </p>
        </section>
      ) : null}

      {hasPrintPrices ? (
        <section className="mt-10 border-t border-zinc-200 pt-8">
          <div
            className="max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-700 [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-zinc-900 [&_img]:h-auto [&_img]:max-w-full [&_p]:my-1.5"
            dangerouslySetInnerHTML={{ __html: printPricesHtml }}
          />
        </section>
      ) : null}

      {tags.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
            Etiketler
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-orange-300 hover:text-orange-700"
                href={`/arama?q=${encodeURIComponent(tag)}`}
                key={tag}
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function ProductPage(props: PageProps<"/urun/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={props.params} />
      </Suspense>
    </div>
  );
}
