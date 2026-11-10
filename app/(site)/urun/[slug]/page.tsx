import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { Breadcrumb, type Crumb } from "@/components/catalog/catalog-chrome";
import {
  ProductDetail,
  type ProductDetailVariant,
} from "@/components/catalog/product-detail";
import { RecentlyViewedTracker } from "@/components/catalog/recently-viewed-tracker";
import { SimilarProducts } from "@/components/catalog/similar-products";
import { WhatsAppShareButton } from "@/components/catalog/whatsapp-share-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { descriptionToText, parseImages } from "@/lib/format";
import { getProductBySlug } from "@/lib/queries";
import {
  absoluteImages,
  absoluteUrl,
  isSafeSlug,
  openGraphBase,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  // Partial Prerender static shell'i 200 ile gönderdiği için notFound() durum
  // kodunu değiştiremiyor; soft-404'ün indekslenmesini meta ile engelliyoruz.
  if (!data) {
    return { title: "Ürün bulunamadı", robots: { index: false, follow: true } };
  }

  const product = data.product;
  const title = product.meta_title || product.name;
  const description =
    product.meta_description ||
    descriptionToText(product.description).slice(0, 160) ||
    `${product.name} - kurumsal promosyon ürünü.`;
  const canonical = isSafeSlug(slug) ? `/urun/${slug}` : undefined;
  const images = absoluteImages(
    data.variants.flatMap((variant) => parseImages(variant.images)).at(0)
  );
  const ogImage = images[0];

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      ...openGraphBase,
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: product.name }] : openGraphBase.images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function Section({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <p className="eyebrow">{label}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
      <div className="aspect-square animate-pulse rounded-sm border border-line bg-surface/60" />
      <div className="space-y-4">
        <div className="h-9 w-3/4 animate-pulse rounded-sm bg-surface" />
        <div className="h-5 w-32 animate-pulse rounded-sm bg-surface" />
        <div className="h-12 w-full animate-pulse rounded-sm bg-surface" />
        <div className="h-24 w-full animate-pulse rounded-sm bg-surface" />
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

  const shareUrl = absoluteUrl(`/urun/${product.slug}`);

  const crumbs: Crumb[] = [
    { href: "/", label: "Ana Sayfa" },
    ...(parent ? [{ href: `/kategori/${parent.slug}`, label: parent.name }] : []),
    ...(category
      ? [{ href: `/kategori/${category.slug}`, label: category.name }]
      : []),
    { label: product.name },
  ];

  return (
    <div>
      <Breadcrumb items={crumbs} />

      <header className="mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl">
          <p className="eyebrow">{category?.name ?? "Katalog"}</p>
          <h1 className="mt-3 font-display text-[2rem] leading-[1.05] font-semibold tracking-tight text-ink text-balance sm:text-4xl">
            {product.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="border-b border-line pb-1 font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">
            Kod {product.code}
          </p>
          <WhatsAppShareButton
            title={product.name}
            url={shareUrl ?? `/urun/${product.slug}`}
          />
          <FavoriteButton productId={product.id} showLabel />
        </div>
      </header>

      <div className="mt-10">
        <ProductDetail productName={product.name} variants={detailVariants} />
      </div>

      {description ? (
        <Section label="Ürün açıklaması">
          <p className="max-w-3xl text-sm leading-7 whitespace-pre-line text-ink-muted">
            {description}
          </p>
        </Section>
      ) : null}

      {hasPrintPrices ? (
        <Section label="Baskı fiyatları">
          <div
            className="rich-text max-w-3xl rounded-sm border border-line bg-surface/60 p-6 text-sm leading-6 text-ink-muted"
            dangerouslySetInnerHTML={{ __html: printPricesHtml }}
          />
        </Section>
      ) : null}

      {tags.length > 0 ? (
        <Section label="Etiketler">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                className="rounded-sm border border-line bg-paper px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase transition-colors hover:border-ink hover:text-ink"
                href={`/arama?q=${encodeURIComponent(tag)}`}
                key={tag}
              >
                {tag}
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <RecentlyViewedTracker productId={product.id} />

      <SimilarProducts category={category} productId={product.id} />
    </div>
  );
}

export default function ProductPage(props: PageProps<"/urun/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:py-14">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={props.params} />
      </Suspense>
    </div>
  );
}
