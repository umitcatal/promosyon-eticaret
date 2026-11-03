import type {
  HomeBannerAspect,
  HomeProcessStep,
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
  "slider",
  "categories",
  "featured_products",
  "process",
  "new_products",
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
  { value: 1, label: "1'li (tam genişlik)" },
  { value: 2, label: "2'li" },
  { value: 3, label: "3'lü" },
];

export const BANNER_ASPECT_OPTIONS: readonly {
  value: HomeBannerAspect;
  label: string;
}[] = [
  { value: "wide", label: "Geniş (2.78:1)" },
  { value: "standard", label: "Standart (16:9)" },
  { value: "square", label: "Kare (1:1)" },
];

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

export function parseHomeWidgetConfig(
  raw: string | null | undefined
): HomeWidgetConfig {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const steps = normalizeProcessSteps((parsed as { steps?: unknown }).steps);
    return steps.length > 0 ? { steps } : {};
  } catch {
    return {};
  }
}
