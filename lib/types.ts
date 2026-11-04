export type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  active: number;
  show_on_home: number;
};

export type ProductRow = {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string | null;
  baski_fiyatlari: string | null;
  category_id: number | null;
  is_featured: number;
  is_hidden: number;
  active: number;
  updated_at: string;
};

export type VariantRow = {
  id: number;
  product_id: number;
  attr_group: string | null;
  attr_name: string | null;
  images: string;
  price: number | null;
  net_price: number | null;
  discount: number | null;
  stock: number | null;
  price_updated_at: string | null;
  price_source: string | null;
  is_hidden: number;
  active: number;
  updated_at: string;
};

export type ProductListItem = ProductRow & {
  image: string | null;
  min_price: number | null;
  max_price: number | null;
  variant_count: number;
};

export type CategoryNode = Category & { children: CategoryNode[] };

export type CategoryTreeItem = Category & {
  children: CategoryTreeItem[];
  product_count: number;
};

export type SliderItem = {
  id: number;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sort_order: number;
  active: number;
};

export type Page = {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

export type MenuItemType = "link" | "page" | "categories";

export type MenuItem = {
  id: number;
  label: string;
  type: MenuItemType;
  href: string | null;
  page_id: number | null;
  open_in_new_tab: number;
  sort_order: number;
  active: number;
};

export type MenuNavItem = {
  id: number;
  label: string;
  type: MenuItemType;
  href: string;
  open_in_new_tab: boolean;
};

export type HomeWidgetType =
  | "slider"
  | "categories"
  | "featured_products"
  | "process"
  | "new_products"
  | "banner"
  | "seo_text";

export type HomeWidgetBannerLayout = 1 | 2 | 3;

export type HomeBannerAspect = "wide" | "standard" | "square";

export type HomeBannerWidth = "container" | "full";

export type HomeProcessStep = {
  title: string;
  description: string;
};

export type HomeSeoTextConfig = {
  content: string;
  collapsedByDefault: boolean;
};

export type HomeWidgetConfig = {
  steps?: HomeProcessStep[];
  seo?: HomeSeoTextConfig;
};

export type HomeWidgetBanner = {
  id: number;
  widget_id: number;
  image_url: string;
  alt_text: string | null;
  link: string | null;
  open_in_new_tab: number;
  sort_order: number;
  active: number;
};

export type HomeWidget = {
  id: number;
  type: HomeWidgetType;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  link_label: string | null;
  banner_layout: HomeWidgetBannerLayout;
  aspect: HomeBannerAspect;
  banner_width: HomeBannerWidth;
  item_limit: number;
  config: HomeWidgetConfig;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
};

export type HomeWidgetWithBanners = HomeWidget & {
  banners: HomeWidgetBanner[];
};

export type HomeWidgetRow = Omit<
  HomeWidget,
  "type" | "banner_layout" | "aspect" | "banner_width" | "config"
> & {
  type: string;
  banner_layout: number;
  aspect: string;
  banner_width: string;
  config: string;
};

export type SearchProductItem = {
  id: number;
  code: string;
  name: string;
  slug: string;
  image: string | null;
  min_price: number | null;
  max_price: number | null;
};

export type SearchCategoryItem = {
  id: number;
  name: string;
  slug: string;
  parent_name: string | null;
};

export type SearchTypeaheadResult = {
  query: string;
  products: SearchProductItem[];
  productTotal: number;
  categories: SearchCategoryItem[];
};
