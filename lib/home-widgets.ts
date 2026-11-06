import type {
  CarouselStyleConfig,
  CollectionSlideStep,
  CollectionWidgetConfig,
  HomeBannerAspect,
  HomeBannerWidth,
  HomeProcessStep,
  HomeSeoTextConfig,
  HomeWidgetBannerLayout,
  HomeWidgetConfig,
  HomeWidgetType,
} from "./types";

export type HomeWidgetDefaults = {
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  link_label: string | null;
  item_limit: number;
};

export type HomeWidgetMeta = {
  label: string;
  description: string;
  defaults: HomeWidgetDefaults;
};

export const HOME_WIDGET_TYPES: readonly HomeWidgetType[] = [
  "banner",
  "collection",
  "recently_viewed",
  "slider",
  "categories",
  "featured_products",
  "process",
  "new_products",
  "seo_text",
];

const TYPE_SET = new Set<string>(HOME_WIDGET_TYPES);

export const DEFAULT_PROCESS_STEPS: HomeProcessStep[] = [
  {
    title: "Kurumsal Baskı",
    description: "Ürünlerinize şirket logonuzu ve özel tasarımlarınızı uygularız.",
  },
  {
    title: "Geniş Ürün Yelpazesi",
    description: "Kalemden teknolojiye 500'den fazla promosyon ürünü.",
  },
  {
    title: "Teklif Odaklı Süreç",
    description: "Siparişiniz sonrası ekibimiz ihtiyaçlarınıza özel fiyat iletir.",
  },
  {
    title: "Hızlı Tedarik",
    description: "Stoktan ve üretimden hızlı sevkiyat seçenekleri.",
  },
];

export const HOME_WIDGET_META: Record<HomeWidgetType, HomeWidgetMeta> = {
  banner: {
    label: "Banner",
    description: "1, 2 veya 3 görselli banner alanı.",
    defaults: {
      eyebrow: null,
      title: null,
      subtitle: null,
      link: null,
      link_label: null,
      item_limit: 0,
    },
  },
  slider: {
    label: "Slider",
    description: "Hero slider; görseller mevcut Slider ekranından yönetilir.",
    defaults: {
      eyebrow: null,
      title: null,
      subtitle: null,
      link: null,
      link_label: null,
      item_limit: 8,
    },
  },
  collection: {
    label: "Koleksiyon",
    description:
      "Seçili koleksiyonun ürünleri; masaüstünde slider, mobilde slider veya grid.",
    defaults: {
      eyebrow: null,
      title: null,
      subtitle: null,
      link: null,
      link_label: "Tümünü gör",
      item_limit: 20,
    },
  },
  recently_viewed: {
    label: "Son Gezilenler",
    description:
      "Ziyaretçinin tarayıcısında hatırlanan son ürünler; kayıt yoksa ana sayfada hiç görünmez.",
    defaults: {
      eyebrow: null,
      title: "Son Gezilen Ürünler",
      subtitle: null,
      link: null,
      link_label: null,
      item_limit: 12,
    },
  },
  categories: {
    label: "Kategoriler",
    description: "Ana sayfada öne çıkarılan kategori vitrini.",
    defaults: {
      eyebrow: "Bölüm 01 — Koleksiyon",
      title: "Ürün Grupları",
      subtitle: null,
      link: null,
      link_label: null,
      item_limit: 0,
    },
  },
  featured_products: {
    label: "Öne Çıkan Ürünler",
    description: "Öne çıkan ürünlerden oluşan grid.",
    defaults: {
      eyebrow: "Bölüm 02 — Seçki",
      title: "Öne Çıkan Ürünler",
      subtitle: null,
      link: "/urunler",
      link_label: "Tüm Ürünler",
      item_limit: 8,
    },
  },
  process: {
    label: "Süreç Şeridi",
    description: "Koyu zeminli 'nasıl çalışır' bandı.",
    defaults: {
      eyebrow: "Nasıl çalışır",
      title: "Tekliften\n*teslime*\ntemiz bir süreç.",
      subtitle: null,
      link: null,
      link_label: null,
      item_limit: 0,
    },
  },
  new_products: {
    label: "Yeni Gelenler",
    description: "Son eklenen ürünlerin listesi.",
    defaults: {
      eyebrow: "Bölüm 03 — Stok",
      title: "Yeni Gelenler",
      subtitle:
        "Kataloğa eklenen son ürünler. Fiyatlar teklif bazlıdır; ürün kodunu belirterek ekibimizden fiyat isteyebilirsiniz.",
      link: null,
      link_label: null,
      item_limit: 6,
    },
  },
  seo_text: {
    label: "SEO Metni",
    description:
      "Katlanabilir arama motoru metni; sıralamada en alta taşınır.",
    defaults: {
      eyebrow: null,
      title: null,
      subtitle: null,
      link: null,
      link_label: null,
      item_limit: 0,
    },
  },
};

export const HOME_WIDGET_TYPE_OPTIONS = HOME_WIDGET_TYPES.map((value) => ({
  value,
  label: HOME_WIDGET_META[value].label,
  description: HOME_WIDGET_META[value].description,
}));

export const BANNER_LAYOUT_OPTIONS: readonly {
  value: HomeWidgetBannerLayout;
  label: string;
}[] = [
  { value: 1, label: "1'li" },
  { value: 2, label: "2'li" },
  { value: 3, label: "3'lü" },
];

export const BANNER_WIDTH_OPTIONS: readonly {
  value: HomeBannerWidth;
  label: string;
  description: string;
}[] = [
  {
    value: "container",
    label: "Container alanı",
    description: "Diğer bölümlerle aynı hizada, kenar boşluklu.",
  },
  {
    value: "full",
    label: "Tam genişlik",
    description: "Ekranın sağ ve sol kenarlarına yaslanır.",
  },
];

export const BANNER_ASPECT_OPTIONS: readonly {
  value: HomeBannerAspect;
  label: string;
}[] = [
  { value: "wide", label: "Geniş (2.78:1)" },
  { value: "standard", label: "Standart (16:9)" },
  { value: "square", label: "Kare (1:1)" },
];

export const COLLECTION_DESKTOP_OPTIONS: readonly {
  value: 4 | 5 | 6;
  label: string;
}[] = [
  { value: 4, label: "4'lü" },
  { value: 5, label: "5'li" },
  { value: 6, label: "6'lı" },
];

export const COLLECTION_MOBILE_OPTIONS: readonly {
  value: 1 | 2 | 3;
  label: string;
}[] = [
  { value: 1, label: "1'li" },
  { value: 2, label: "2'li" },
  { value: 3, label: "3'lü" },
];

export const COLLECTION_MOBILE_LAYOUT_OPTIONS: readonly {
  value: CollectionWidgetConfig["mobileLayout"];
  label: string;
}[] = [
  { value: "slider", label: "Kaydırmalı slider" },
  { value: "grid", label: "Statik grid" },
];

export const COLLECTION_SLIDE_STEP_OPTIONS: readonly {
  value: CollectionSlideStep;
  label: string;
}[] = [
  { value: "page", label: "Sayfa halinde" },
  { value: "item", label: "Tek tek" },
];

export const COLLECTION_AUTOPLAY_MIN = 2;
export const COLLECTION_AUTOPLAY_MAX = 30;
export const COLLECTION_AUTOPLAY_DEFAULT = 5;

export const DEFAULT_CAROUSEL_STYLE: CarouselStyleConfig = {
  perViewDesktop: 4,
  perViewMobile: 2,
  mobileLayout: "slider",
  autoplay: false,
  autoplayInterval: COLLECTION_AUTOPLAY_DEFAULT,
  slideStep: "page",
};

export const COLLECTION_DESKTOP_WIDTH: Record<4 | 5 | 6, string> = {
  4: "lg:w-[calc((100%-3rem)/4)]",
  5: "lg:w-[calc((100%-4rem)/5)]",
  6: "lg:w-[calc((100%-5rem)/6)]",
};

export const COLLECTION_MOBILE_SLIDER_WIDTH: Record<1 | 2 | 3, string> = {
  1: "w-full",
  2: "w-[calc((100%-1rem)/2)]",
  3: "w-[calc((100%-2rem)/3)]",
};

export const COLLECTION_MOBILE_GRID_COLS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

export const COLLECTION_IMAGE_SIZES: Record<4 | 5 | 6, string> = {
  4: "(max-width: 1024px) 50vw, 25vw",
  5: "(max-width: 1024px) 50vw, 20vw",
  6: "(max-width: 1024px) 50vw, 16vw",
};

export function carouselClassNames(style: CarouselStyleConfig): {
  item: string;
  list: string;
} {
  const list =
    style.mobileLayout === "grid"
      ? `grid gap-4 ${COLLECTION_MOBILE_GRID_COLS[style.perViewMobile]} lg:flex lg:gap-4 lg:overflow-x-auto lg:snap-x lg:snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`
      : "flex gap-4 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

  const item =
    style.mobileLayout === "grid"
      ? `lg:shrink-0 lg:snap-start ${COLLECTION_DESKTOP_WIDTH[style.perViewDesktop]}`
      : `shrink-0 snap-start ${COLLECTION_MOBILE_SLIDER_WIDTH[style.perViewMobile]} ${COLLECTION_DESKTOP_WIDTH[style.perViewDesktop]}`;

  return { item, list };
}

export const BANNER_ASPECTS: Record<HomeBannerAspect, { className: string }> =
  {
    wide: { className: "aspect-[2.78/1]" },
    standard: { className: "aspect-video" },
    square: { className: "aspect-square" },
  };

export const BANNER_SIZES: Record<HomeWidgetBannerLayout, string> = {
  1: "(max-width: 1024px) 100vw, 1280px",
  2: "(max-width: 640px) 100vw, 640px",
  3: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px",
};

export const BANNER_FULL_SIZES: Record<HomeWidgetBannerLayout, string> = {
  1: "100vw",
  2: "(max-width: 640px) 100vw, 50vw",
  3: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
};

const BANNER_GRID_CLASSES: Record<HomeWidgetBannerLayout, string> = {
  1: "grid grid-cols-1 gap-3 sm:gap-4",
  2: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4",
  3: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3",
};

export function isHomeWidgetType(value: unknown): value is HomeWidgetType {
  return typeof value === "string" && TYPE_SET.has(value);
}

export function isBannerLayout(
  value: unknown
): value is HomeWidgetBannerLayout {
  return value === 1 || value === 2 || value === 3;
}

export function isBannerAspect(value: unknown): value is HomeBannerAspect {
  return value === "wide" || value === "standard" || value === "square";
}

export function isBannerWidth(value: unknown): value is HomeBannerWidth {
  return value === "container" || value === "full";
}

export function bannerGridClass(columns: number): string {
  const normalized = Math.min(3, Math.max(1, Math.trunc(columns))) as
    | 1
    | 2
    | 3;
  return BANNER_GRID_CLASSES[normalized];
}

export function clampItemLimit(
  value: unknown,
  fallback: number,
  min = 0,
  max = 24
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function isValidHref(href: string): boolean {
  if (href.startsWith("/")) return !href.startsWith("//");
  return /^https?:\/\//i.test(href);
}

export function normalizeProcessSteps(input: unknown): HomeProcessStep[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const record = (item ?? {}) as {
        title?: unknown;
        description?: unknown;
      };
      return {
        title: String(record.title ?? "").trim(),
        description: String(record.description ?? "").trim(),
      };
    })
    .filter((step) => step.title !== "" || step.description !== "")
    .slice(0, 8);
}

export function normalizeSeoText(
  input: unknown
): HomeSeoTextConfig | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const record = input as { content?: unknown; collapsedByDefault?: unknown };
  const content = typeof record.content === "string" ? record.content : "";
  const hasVisibleText = content
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim() !== "";

  if (!hasVisibleText) return undefined;

  return {
    content,
    collapsedByDefault: record.collapsedByDefault === true,
  };
}

export function isCollectionPerViewDesktop(
  value: unknown
): value is 4 | 5 | 6 {
  return value === 4 || value === 5 || value === 6;
}

export function isCollectionPerViewMobile(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

export function isCollectionMobileLayout(
  value: unknown
): value is CollectionWidgetConfig["mobileLayout"] {
  return value === "slider" || value === "grid";
}

export function isCollectionSlideStep(
  value: unknown
): value is CollectionSlideStep {
  return value === "item" || value === "page";
}

export function clampAutoplayInterval(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return COLLECTION_AUTOPLAY_DEFAULT;
  return Math.min(
    COLLECTION_AUTOPLAY_MAX,
    Math.max(COLLECTION_AUTOPLAY_MIN, Math.trunc(parsed))
  );
}

export function normalizeCarouselStyle(
  input: unknown
): CarouselStyleConfig | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const record = input as {
    perViewDesktop?: unknown;
    perViewMobile?: unknown;
    mobileLayout?: unknown;
    autoplay?: unknown;
    autoplayInterval?: unknown;
    slideStep?: unknown;
  };

  const rawDesktop = Number(record.perViewDesktop);
  const perViewDesktop = isCollectionPerViewDesktop(rawDesktop)
    ? rawDesktop
    : DEFAULT_CAROUSEL_STYLE.perViewDesktop;
  const rawMobile = Number(record.perViewMobile);
  const perViewMobile = isCollectionPerViewMobile(rawMobile)
    ? rawMobile
    : DEFAULT_CAROUSEL_STYLE.perViewMobile;
  const mobileLayout = isCollectionMobileLayout(record.mobileLayout)
    ? record.mobileLayout
    : DEFAULT_CAROUSEL_STYLE.mobileLayout;
  const autoplay = record.autoplay === true;
  const autoplayInterval = clampAutoplayInterval(record.autoplayInterval);
  const slideStep = isCollectionSlideStep(record.slideStep)
    ? record.slideStep
    : DEFAULT_CAROUSEL_STYLE.slideStep;

  return {
    perViewDesktop,
    perViewMobile,
    mobileLayout,
    autoplay,
    autoplayInterval,
    slideStep,
  };
}

export function normalizeCollectionConfig(
  input: unknown
): CollectionWidgetConfig | undefined {
  const style = normalizeCarouselStyle(input);
  if (!style) return undefined;

  const collectionId = Number(
    (input as { collectionId?: unknown }).collectionId
  );
  if (!Number.isInteger(collectionId) || collectionId <= 0) return undefined;

  return { collectionId, ...style };
}

export function parseHomeWidgetConfig(
  raw: string | null | undefined
): HomeWidgetConfig {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const config: HomeWidgetConfig = {};
    const steps = normalizeProcessSteps((parsed as { steps?: unknown }).steps);
    if (steps.length > 0) config.steps = steps;

    const seo = normalizeSeoText((parsed as { seo?: unknown }).seo);
    if (seo) config.seo = seo;

    const collection = normalizeCollectionConfig(
      (parsed as { collection?: unknown }).collection
    );
    if (collection) config.collection = collection;

    const recentlyViewed = normalizeCarouselStyle(
      (parsed as { recentlyViewed?: unknown }).recentlyViewed
    );
    if (recentlyViewed) config.recentlyViewed = recentlyViewed;

    return config;
  } catch {
    return {};
  }
}
