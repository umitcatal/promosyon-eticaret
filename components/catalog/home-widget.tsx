import Image from "next/image";
import Link from "next/link";
import {
  CategoryIndex,
  type CategoryCard,
} from "@/components/catalog/category-index";
import { CarouselShell } from "@/components/catalog/carousel-shell";
import {
  ProductCard,
  ProductGrid,
  ProductLedger,
} from "@/components/catalog/product-card";
import { HeroFallback, Slider } from "@/components/catalog/slider";
import { SeoTextBlock } from "@/components/catalog/seo-text-block";
import { Reveal } from "@/components/motion/reveal";
import {
  BANNER_ASPECTS,
  BANNER_FULL_SIZES,
  BANNER_SIZES,
  bannerGridClass,
  COLLECTION_DESKTOP_WIDTH,
  COLLECTION_IMAGE_SIZES,
  COLLECTION_MOBILE_GRID_COLS,
  COLLECTION_MOBILE_SLIDER_WIDTH,
} from "@/lib/home-widgets";
import {
  getCategoryCardImage,
  getCollectionWidgetProducts,
  getFeaturedProducts,
  getHomeCategoryTree,
  getNewProducts,
  getSliderItems,
} from "@/lib/queries";
import { sanitizeRichText } from "@/lib/sanitize";
import type {
  HomeWidgetBanner,
  HomeWidgetWithBanners,
} from "@/lib/types";

const TITLE_CLASS =
  "mt-3 font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl lg:text-5xl";

function WidgetHeading({
  widget,
  eyebrowClassName = "eyebrow",
  titleClassName = TITLE_CLASS,
  subtitleClassName = "mt-4 max-w-2xl text-sm leading-6 text-ink-muted",
}: {
  widget: HomeWidgetWithBanners;
  eyebrowClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  if (!widget.eyebrow && !widget.title && !widget.subtitle) return null;

  return (
    <div>
      {widget.eyebrow ? (
        <p className={eyebrowClassName}>{widget.eyebrow}</p>
      ) : null}
      {widget.title ? <h2 className={titleClassName}>{widget.title}</h2> : null}
      {widget.subtitle ? (
        <p className={subtitleClassName}>{widget.subtitle}</p>
      ) : null}
    </div>
  );
}

function WidgetLink({
  link,
  label,
  className = "",
}: {
  link: string | null;
  label: string | null;
  className?: string;
}) {
  if (!link || !label) return null;

  return (
    <Link
      className={`group inline-flex items-center gap-2 border-b border-line-strong pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700 ${className}`}
      href={link}
    >
      {label}
      <span
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}

function ProcessTitle({ title }: { title: string }) {
  return (
    <>
      {title.split("\n").map((line, index) => {
        const accented =
          line.length > 2 && line.startsWith("*") && line.endsWith("*");
        return (
          <span
            className={accented ? "block text-brass-200 italic" : "block"}
            key={`${line}-${index}`}
          >
            {accented ? line.slice(1, -1) : line}
          </span>
        );
      })}
    </>
  );
}

function BannerCard({
  banner,
  aspectClass,
  sizes,
  fallbackAlt,
}: {
  banner: HomeWidgetBanner;
  aspectClass: string;
  sizes: string;
  fallbackAlt: string;
}) {
  const frame = (
    <div
      className={`relative w-full overflow-hidden rounded-sm border border-line bg-surface ${aspectClass}`}
    >
      <Image
        alt={banner.alt_text || fallbackAlt}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        fill
        sizes={sizes}
        src={banner.image_url}
        unoptimized={banner.image_url.startsWith("http")}
      />
    </div>
  );

  if (!banner.link) return frame;

  return (
    <Link
      className="group block"
      href={banner.link}
      {...(banner.open_in_new_tab === 1
        ? { rel: "noreferrer noopener", target: "_blank" }
        : {})}
    >
      {frame}
    </Link>
  );
}

async function SliderWidget({ widget }: { widget: HomeWidgetWithBanners }) {
  const slides = await getSliderItems();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-4 sm:pt-6">
      {slides.length > 0 ? (
        <Slider eyebrow={widget.eyebrow} slides={slides} />
      ) : (
        <HeroFallback />
      )}
    </section>
  );
}

async function CategoriesWidget({
  widget,
}: {
  widget: HomeWidgetWithBanners;
}) {
  const homeCategories = await getHomeCategoryTree();

  const cards: CategoryCard[] = await Promise.all(
    homeCategories.map(async (top) => ({
      id: top.id,
      name: top.name,
      slug: top.slug,
      childCount: top.children.length,
      image:
        top.image_url ??
        (await getCategoryCardImage([
          top.id,
          ...top.children.map((child) => child.id),
        ])),
    }))
  );

  const visible =
    widget.item_limit > 0 ? cards.slice(0, widget.item_limit) : cards;
  if (visible.length === 0) return null;

  const hasHeader = Boolean(
    widget.eyebrow || widget.title || widget.subtitle || widget.link
  );

  return (
    <Reveal className="mx-auto w-full max-w-7xl px-4">
      <section className="mt-16 sm:mt-24" id="kategoriler">
        {hasHeader ? (
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <WidgetHeading widget={widget} />
            <WidgetLink label={widget.link_label} link={widget.link} />
          </div>
        ) : null}
        <div className="mt-8">
          <CategoryIndex categories={visible} />
        </div>
      </section>
    </Reveal>
  );
}

async function FeaturedProductsWidget({
  widget,
}: {
  widget: HomeWidgetWithBanners;
}) {
  const products = await getFeaturedProducts(
    Math.max(1, widget.item_limit || 8)
  );
  if (products.length === 0) return null;

  const hasHeader = Boolean(
    widget.eyebrow || widget.title || widget.subtitle || widget.link
  );

  return (
    <Reveal className="mx-auto w-full max-w-7xl px-4">
      <section className="mt-20 sm:mt-28">
        {hasHeader ? (
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <WidgetHeading widget={widget} />
            <WidgetLink label={widget.link_label} link={widget.link} />
          </div>
        ) : null}
        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      </section>
    </Reveal>
  );
}

function ProcessWidget({ widget }: { widget: HomeWidgetWithBanners }) {
  const steps = widget.config.steps ?? [];
  if (steps.length === 0) return null;

  const hasHeader = Boolean(widget.eyebrow || widget.title || widget.subtitle);

  return (
    <Reveal>
      <section className="mt-20 border-y border-line-strong bg-ink sm:mt-28">
        <div
          className={`mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:py-18 lg:gap-16 lg:py-20 ${
            hasHeader ? "lg:grid-cols-[minmax(0,340px)_1fr]" : ""
          }`}
        >
          {hasHeader ? (
            <div>
              {widget.eyebrow ? (
                <p className="eyebrow text-brass-300">{widget.eyebrow}</p>
              ) : null}
              {widget.title ? (
                <h2 className="mt-4 font-display text-3xl leading-[1.05] font-semibold text-paper sm:text-4xl">
                  <ProcessTitle title={widget.title} />
                </h2>
              ) : null}
              {widget.subtitle ? (
                <p className="mt-4 text-sm leading-6 text-paper/65">
                  {widget.subtitle}
                </p>
              ) : null}
            </div>
          ) : null}
          <ol className="grid gap-px bg-line/15 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li
                className="bg-ink px-1 py-6 sm:px-4"
                key={`${step.title}-${index}`}
              >
                <span className="font-display text-4xl leading-none font-semibold text-brand-300/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {step.title ? (
                  <h3 className="mt-4 font-display text-lg font-semibold text-paper">
                    {step.title}
                  </h3>
                ) : null}
                {step.description ? (
                  <p className="mt-2 text-sm leading-6 text-paper/65">
                    {step.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Reveal>
  );
}

async function NewProductsWidget({
  widget,
}: {
  widget: HomeWidgetWithBanners;
}) {
  const products = await getNewProducts(Math.max(1, widget.item_limit || 6));
  if (products.length === 0) return null;

  return (
    <Reveal className="mx-auto w-full max-w-7xl px-4">
      <section className="mt-20 grid gap-8 sm:mt-28 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <WidgetHeading
            subtitleClassName="mt-4 text-sm leading-6 text-ink-muted"
            titleClassName="mt-3 font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl"
            widget={widget}
          />
          <WidgetLink
            className="mt-6"
            label={widget.link_label}
            link={widget.link}
          />
        </div>
        <ProductLedger products={products} />
      </section>
    </Reveal>
  );
}

function BannerWidget({ widget }: { widget: HomeWidgetWithBanners }) {
  const banners = widget.banners.slice(0, widget.banner_layout);
  if (banners.length === 0) return null;

  const columns = Math.min(
    widget.banner_layout,
    banners.length
  ) as 1 | 2 | 3;
  const aspect = BANNER_ASPECTS[widget.aspect] ?? BANNER_ASPECTS.wide;
  const isFull = widget.banner_width === "full";
  const hasHeader = Boolean(
    widget.eyebrow || widget.title || widget.subtitle || widget.link
  );

  return (
    <Reveal
      className={isFull ? "w-full" : "mx-auto w-full max-w-7xl px-4"}
    >
      <section className="mt-16 sm:mt-24">
        {hasHeader ? (
          <div
            className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-3 ${
              isFull ? "mx-auto max-w-7xl px-4" : ""
            }`}
          >
            <WidgetHeading widget={widget} />
            <WidgetLink label={widget.link_label} link={widget.link} />
          </div>
        ) : null}
        <div
          className={`${hasHeader ? "mt-8 " : ""}${bannerGridClass(columns)}`}
        >
          {banners.map((banner) => (
            <BannerCard
              aspectClass={aspect.className}
              banner={banner}
              fallbackAlt={widget.title ?? "Banner"}
              key={banner.id}
              sizes={
                isFull ? BANNER_FULL_SIZES[columns] : BANNER_SIZES[columns]
              }
            />
          ))}
        </div>
      </section>
    </Reveal>
  );
}

async function CollectionWidget({
  widget,
}: {
  widget: HomeWidgetWithBanners;
}) {
  const config = widget.config.collection;
  if (!config) return null;

  const data = await getCollectionWidgetProducts(
    config.collectionId,
    Math.max(1, widget.item_limit || 20)
  );
  if (!data || data.items.length === 0) return null;

  const { collection, items } = data;
  const title = widget.title ?? collection.name;
  const headingWidget = { ...widget, title };
  const link = `/koleksiyon/${collection.slug}`;
  const label = widget.link_label ?? "Tümünü gör";
  const sizes = COLLECTION_IMAGE_SIZES[config.perViewDesktop];

  const listClassName =
    config.mobileLayout === "grid"
      ? `grid gap-4 ${COLLECTION_MOBILE_GRID_COLS[config.perViewMobile]} lg:flex lg:gap-4 lg:overflow-x-auto lg:snap-x lg:snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
      : "flex gap-4 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  const itemClassName =
    config.mobileLayout === "grid"
      ? `lg:shrink-0 lg:snap-start ${COLLECTION_DESKTOP_WIDTH[config.perViewDesktop]}`
      : `shrink-0 snap-start ${COLLECTION_MOBILE_SLIDER_WIDTH[config.perViewMobile]} ${COLLECTION_DESKTOP_WIDTH[config.perViewDesktop]}`;

  return (
    <Reveal className="mx-auto w-full max-w-7xl px-4">
      <section className="mt-20 sm:mt-28">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <WidgetHeading widget={headingWidget} />
          <WidgetLink label={label} link={link} />
        </div>
        <div className="mt-8">
          <CarouselShell
            arrowsOnMobile={config.mobileLayout === "slider"}
            autoplay={config.autoplay}
            autoplayInterval={config.autoplayInterval}
            className={listClassName}
            label={title}
            step={config.slideStep}
          >
            {items.map((product) => (
              <li className={itemClassName} key={product.id}>
                <ProductCard product={product} sizes={sizes} />
              </li>
            ))}
          </CarouselShell>
        </div>
      </section>
    </Reveal>
  );
}

function SeoTextWidget({ widget }: { widget: HomeWidgetWithBanners }) {
  const seo = widget.config.seo;
  if (!seo) return null;

  return (
    <Reveal className="mx-auto w-full max-w-7xl px-4">
      <section className="mt-16 border-t border-line pt-8 sm:mt-24 sm:pt-10">
        <SeoTextBlock
          collapsedByDefault={seo.collapsedByDefault}
          html={sanitizeRichText(seo.content)}
          id={widget.id}
        />
      </section>
    </Reveal>
  );
}

export async function HomeWidgetSection({
  widget,
}: {
  widget: HomeWidgetWithBanners;
}) {
  switch (widget.type) {
    case "slider":
      return <SliderWidget widget={widget} />;
    case "categories":
      return <CategoriesWidget widget={widget} />;
    case "featured_products":
      return <FeaturedProductsWidget widget={widget} />;
    case "process":
      return <ProcessWidget widget={widget} />;
    case "new_products":
      return <NewProductsWidget widget={widget} />;
    case "banner":
      return <BannerWidget widget={widget} />;
    case "collection":
      return <CollectionWidget widget={widget} />;
    case "seo_text":
      return <SeoTextWidget widget={widget} />;
    default:
      return null;
  }
}
