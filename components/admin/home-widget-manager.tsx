"use client";

import Link from "next/link";
import {
  useActionState,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  createHomeWidgetAction,
  deleteHomeBannerAction,
  deleteHomeWidgetAction,
  reorderHomeBannersAction,
  reorderHomeWidgetsAction,
  saveHomeBannerAction,
  toggleHomeWidgetActiveAction,
  updateHomeWidgetAction,
} from "@/app/actions/home";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { inputClass, labelClass } from "@/components/ui/styles";
import {
  BANNER_ASPECT_OPTIONS,
  BANNER_LAYOUT_OPTIONS,
  BANNER_WIDTH_OPTIONS,
  COLLECTION_AUTOPLAY_DEFAULT,
  COLLECTION_AUTOPLAY_MAX,
  COLLECTION_AUTOPLAY_MIN,
  COLLECTION_DESKTOP_OPTIONS,
  COLLECTION_MOBILE_LAYOUT_OPTIONS,
  COLLECTION_MOBILE_OPTIONS,
  COLLECTION_SLIDE_STEP_OPTIONS,
  HOME_WIDGET_META,
  HOME_WIDGET_TYPE_OPTIONS,
} from "@/lib/home-widgets";
import type {
  Collection,
  HomeWidgetBanner,
  HomeWidgetType,
  HomeWidgetWithBanners,
} from "@/lib/types";

type OptimisticAction =
  | { type: "reorder"; ids: number[] }
  | { type: "toggle"; id: number; active: boolean };

type StepDraft = { title: string; description: string };

function reduceWidgets(
  state: HomeWidgetWithBanners[],
  action: OptimisticAction
): HomeWidgetWithBanners[] {
  if (action.type === "toggle") {
    return state.map((widget) =>
      widget.id === action.id
        ? { ...widget, active: action.active ? 1 : 0 }
        : widget
    );
  }

  const byId = new Map(state.map((widget) => [widget.id, widget]));
  const ordered = action.ids
    .map((id) => byId.get(id))
    .filter((widget): widget is HomeWidgetWithBanners => Boolean(widget));
  const remaining = state.filter((widget) => !action.ids.includes(widget.id));
  return [...ordered, ...remaining];
}

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <circle cx="5" cy="4" r="1.4" />
      <circle cx="11" cy="4" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="11" cy="12" r="1.4" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "up" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToggleSwitch({
  active,
  onToggle,
  disabled,
  label,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      aria-checked={active}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        active ? "bg-orange-600" : "bg-zinc-300"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          active ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function widgetTitle(widget: HomeWidgetWithBanners): string {
  if (widget.title) {
    return widget.title
      .split("\n")
      .filter(Boolean)
      .map((line) => line.replace(/\*/g, ""))
      .join(" ");
  }
  return HOME_WIDGET_META[widget.type].label;
}

function widgetSummary(
  widget: HomeWidgetWithBanners,
  collectionName?: string
): string {
  switch (widget.type) {
    case "banner":
      return `${widget.banners.length} görsel • ${widget.banner_layout}'li düzen • ${
        widget.banner_width === "full" ? "Tam genişlik" : "Container"
      }`;
    case "process":
      return `${widget.config.steps?.length ?? 0} adım`;
    case "categories":
      return widget.item_limit > 0
        ? `${widget.item_limit} kategori`
        : "Tüm kategoriler";
    case "featured_products":
    case "new_products":
      return `${widget.item_limit} ürün`;
    case "collection": {
      const config = widget.config.collection;
      const name = collectionName ?? "Koleksiyon seçilmedi";
      if (!config) return name;
      const step = config.slideStep === "item" ? "tek tek" : "sayfa halinde";
      const autoplay = config.autoplay
        ? ` • oto ${config.autoplayInterval}sn`
        : "";
      return `${name} • ${widget.item_limit} ürün • ${config.perViewDesktop}'lü${
        config.mobileLayout === "grid" ? " • mobil grid" : " • mobil slider"
      } • ${step}${autoplay}`;
    }
    case "seo_text":
      return widget.config.seo
        ? "Zengin metin"
        : "İçerik boş — ana sayfada görünmez";
    default:
      return "Görseller Slider ekranından yönetilir";
  }
}

function AddWidgetForm({ collections }: { collections: Collection[] }) {
  const [state, formAction, pending] = useActionState(
    createHomeWidgetAction,
    {}
  );
  const [type, setType] = useState<HomeWidgetType>("banner");
  const meta = HOME_WIDGET_META[type];
  const isCollection = type === "collection";
  const noCollections = isCollection && collections.length === 0;

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5"
    >
      <p className="text-sm font-bold text-zinc-800">Yeni Widget Ekle</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="widget-type">
            Widget türü
          </label>
          <select
            className={inputClass}
            id="widget-type"
            name="type"
            onChange={(event) =>
              setType(event.target.value as HomeWidgetType)
            }
            value={type}
          >
            {HOME_WIDGET_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">{meta.description}</p>
        </div>

        {type === "banner" ? (
          <>
            <div>
              <label className={labelClass} htmlFor="widget-layout">
                Düzen
              </label>
              <select
                className={inputClass}
                defaultValue={1}
                id="widget-layout"
                name="bannerLayout"
              >
                {BANNER_LAYOUT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="widget-aspect">
                Görsel oranı
              </label>
              <select
                className={inputClass}
                defaultValue="wide"
                id="widget-aspect"
                name="aspect"
              >
                {BANNER_ASPECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="widget-width">
                Genişlik
              </label>
              <select
                className={inputClass}
                defaultValue="container"
                id="widget-width"
                name="bannerWidth"
              >
                {BANNER_WIDTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-400">
                Tam genişlikte görseller ekranın sağ ve sol kenarına yaslanır.
              </p>
            </div>
          </>
        ) : null}

        {isCollection ? (
          <>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="widget-collection">
                Koleksiyon
              </label>
              <select
                className={inputClass}
                defaultValue=""
                id="widget-collection"
                name="collectionId"
                required
              >
                <option disabled value="">
                  Koleksiyon seçin
                </option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                    {collection.active === 1 ? "" : " (pasif)"}
                  </option>
                ))}
              </select>
              {noCollections ? (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  Henüz koleksiyon yok.{" "}
                  <Link
                    className="underline"
                    href="/admin/koleksiyonlar"
                  >
                    Koleksiyon oluşturun
                  </Link>
                  .
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="widget-collection-desktop">
                Masaüstü görünüm
              </label>
              <select
                className={inputClass}
                defaultValue={4}
                id="widget-collection-desktop"
                name="perViewDesktop"
              >
                {COLLECTION_DESKTOP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="widget-collection-mobile">
                Mobil görünüm
              </label>
              <select
                className={inputClass}
                defaultValue={2}
                id="widget-collection-mobile"
                name="perViewMobile"
              >
                {COLLECTION_MOBILE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="widget-collection-layout">
                Mobil düzen
              </label>
              <select
                className={inputClass}
                defaultValue="slider"
                id="widget-collection-layout"
                name="mobileLayout"
              >
                {COLLECTION_MOBILE_LAYOUT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-zinc-200 p-3 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  className="h-4 w-4 accent-orange-600"
                  name="autoplay"
                  type="checkbox"
                />
                Otomatik oynatma
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className={labelClass}
                    htmlFor="widget-collection-autoplay-interval"
                  >
                    Oynatma aralığı (saniye)
                  </label>
                  <input
                    className={inputClass}
                    defaultValue={COLLECTION_AUTOPLAY_DEFAULT}
                    id="widget-collection-autoplay-interval"
                    max={COLLECTION_AUTOPLAY_MAX}
                    min={COLLECTION_AUTOPLAY_MIN}
                    name="autoplayInterval"
                    type="number"
                  />
                </div>
                <div>
                  <label
                    className={labelClass}
                    htmlFor="widget-collection-step"
                  >
                    Kaydırma adımı
                  </label>
                  <select
                    className={inputClass}
                    defaultValue="page"
                    id="widget-collection-step"
                    name="slideStep"
                  >
                    {COLLECTION_SLIDE_STEP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Otomatik oynatma yalnızca slider görünümünde çalışır; fare
                üzerine gelince ve dokunulduğunda duraklar.
              </p>
            </div>
          </>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600">{state.message}</p>
      ) : null}

      <button
        className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || noCollections}
        type="submit"
      >
        {pending ? "Ekleniyor..." : "Widget Ekle"}
      </button>
    </form>
  );
}

function WidgetEditForm({
  collections,
  widget,
}: {
  collections: Collection[];
  widget: HomeWidgetWithBanners;
}) {
  const [state, formAction, pending] = useActionState(
    updateHomeWidgetAction,
    {}
  );
  const [steps, setSteps] = useState<StepDraft[]>(
    () => widget.config.steps ?? []
  );

  const isSlider = widget.type === "slider";
  const isProcess = widget.type === "process";
  const isBanner = widget.type === "banner";
  const isSeoText = widget.type === "seo_text";
  const isCollection = widget.type === "collection";
  const collectionConfig = widget.config.collection;
  const hasHeadingFields = !isSlider && !isSeoText;
  const hasItemLimit =
    widget.type === "categories" ||
    widget.type === "featured_products" ||
    widget.type === "new_products" ||
    widget.type === "collection";

  function updateStep(index: number, field: keyof StepDraft, value: string) {
    setSteps((current) =>
      current.map((step, position) =>
        position === index ? { ...step, [field]: value } : step
      )
    );
  }

  return (
    <form
      action={formAction}
      className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2"
    >
      <input name="widgetId" type="hidden" value={widget.id} />

      {hasHeadingFields ? (
        <div>
          <label className={labelClass} htmlFor={`eyebrow-${widget.id}`}>
            Üst etiket
          </label>
          <input
            className={inputClass}
            defaultValue={widget.eyebrow ?? ""}
            id={`eyebrow-${widget.id}`}
            name="eyebrow"
          />
        </div>
      ) : null}

      {hasHeadingFields ? (
        <div>
          <label className={labelClass} htmlFor={`title-${widget.id}`}>
            Başlık
          </label>
          {isProcess ? (
            <textarea
              className={inputClass}
              defaultValue={widget.title ?? ""}
              id={`title-${widget.id}`}
              name="title"
              rows={3}
            />
          ) : (
            <input
              className={inputClass}
              defaultValue={widget.title ?? ""}
              id={`title-${widget.id}`}
              name="title"
            />
          )}
        </div>
      ) : null}

      {hasHeadingFields ? (
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`subtitle-${widget.id}`}>
            Alt başlık
          </label>
          <textarea
            className={inputClass}
            defaultValue={widget.subtitle ?? ""}
            id={`subtitle-${widget.id}`}
            name="subtitle"
            rows={2}
          />
        </div>
      ) : null}

      {hasHeadingFields && !isProcess && !isCollection ? (
        <>
          <div>
            <label className={labelClass} htmlFor={`link-${widget.id}`}>
              Bağlantı
            </label>
            <input
              className={inputClass}
              defaultValue={widget.link ?? ""}
              id={`link-${widget.id}`}
              name="link"
              placeholder="/kategori/... veya https://..."
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`link-label-${widget.id}`}>
              Bağlantı metni
            </label>
            <input
              className={inputClass}
              defaultValue={widget.link_label ?? ""}
              id={`link-label-${widget.id}`}
              name="link_label"
              placeholder="Tüm Ürünler"
            />
          </div>
        </>
      ) : null}

      {isCollection ? (
        <>
          <div>
            <label className={labelClass} htmlFor={`collection-${widget.id}`}>
              Koleksiyon
            </label>
            <select
              className={inputClass}
              defaultValue={collectionConfig?.collectionId ?? ""}
              id={`collection-${widget.id}`}
              name="collectionId"
              required
            >
              <option disabled value="">
                Koleksiyon seçin
              </option>
              {collectionConfig &&
              !collections.some(
                (collection) => collection.id === collectionConfig.collectionId
              ) ? (
                <option value={collectionConfig.collectionId}>
                  Silinmiş koleksiyon (#{collectionConfig.collectionId})
                </option>
              ) : null}
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                  {collection.active === 1 ? "" : " (pasif)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={labelClass}
              htmlFor={`link-label-${widget.id}`}
            >
              Buton metni
            </label>
            <input
              className={inputClass}
              defaultValue={widget.link_label ?? "Tümünü gör"}
              id={`link-label-${widget.id}`}
              name="link_label"
              placeholder="Tümünü gör"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Buton koleksiyonun kendi sayfasına gider.
            </p>
          </div>
          <div>
            <label
              className={labelClass}
              htmlFor={`collection-desktop-${widget.id}`}
            >
              Masaüstü görünüm
            </label>
            <select
              className={inputClass}
              defaultValue={collectionConfig?.perViewDesktop ?? 4}
              id={`collection-desktop-${widget.id}`}
              name="perViewDesktop"
            >
              {COLLECTION_DESKTOP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={labelClass}
              htmlFor={`collection-mobile-${widget.id}`}
            >
              Mobil görünüm
            </label>
            <select
              className={inputClass}
              defaultValue={collectionConfig?.perViewMobile ?? 2}
              id={`collection-mobile-${widget.id}`}
              name="perViewMobile"
            >
              {COLLECTION_MOBILE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className={labelClass}
              htmlFor={`collection-layout-${widget.id}`}
            >
              Mobil düzen
            </label>
            <select
              className={inputClass}
              defaultValue={collectionConfig?.mobileLayout ?? "slider"}
              id={`collection-layout-${widget.id}`}
              name="mobileLayout"
            >
              {COLLECTION_MOBILE_LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                className="h-4 w-4 accent-orange-600"
                defaultChecked={collectionConfig?.autoplay === true}
                name="autoplay"
                type="checkbox"
              />
              Otomatik oynatma
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  className={labelClass}
                  htmlFor={`collection-autoplay-interval-${widget.id}`}
                >
                  Oynatma aralığı (saniye)
                </label>
                <input
                  className={inputClass}
                  defaultValue={
                    collectionConfig?.autoplayInterval ??
                    COLLECTION_AUTOPLAY_DEFAULT
                  }
                  id={`collection-autoplay-interval-${widget.id}`}
                  max={COLLECTION_AUTOPLAY_MAX}
                  min={COLLECTION_AUTOPLAY_MIN}
                  name="autoplayInterval"
                  type="number"
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  htmlFor={`collection-step-${widget.id}`}
                >
                  Kaydırma adımı
                </label>
                <select
                  className={inputClass}
                  defaultValue={collectionConfig?.slideStep ?? "page"}
                  id={`collection-step-${widget.id}`}
                  name="slideStep"
                >
                  {COLLECTION_SLIDE_STEP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Otomatik oynatma yalnızca slider görünümünde çalışır; fare
              üzerine gelince ve dokunulduğunda duraklar.
            </p>
          </div>
        </>
      ) : null}

      {hasItemLimit ? (
        <div>
          <label className={labelClass} htmlFor={`limit-${widget.id}`}>
            Gösterilecek{" "}
            {widget.type === "categories" ? "kategori" : "ürün"} sayısı
          </label>
          <input
            className={inputClass}
            defaultValue={widget.item_limit}
            id={`limit-${widget.id}`}
            max={24}
            min={widget.type === "categories" ? 0 : 1}
            name="itemLimit"
            type="number"
          />
          {widget.type === "categories" ? (
            <p className="mt-1 text-xs text-zinc-400">0 = tümü</p>
          ) : null}
        </div>
      ) : null}

      {isBanner ? (
        <>
          <div>
            <label className={labelClass} htmlFor={`layout-${widget.id}`}>
              Düzen
            </label>
            <select
              className={inputClass}
              defaultValue={widget.banner_layout}
              id={`layout-${widget.id}`}
              name="bannerLayout"
            >
              {BANNER_LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor={`aspect-${widget.id}`}>
              Görsel oranı
            </label>
            <select
              className={inputClass}
              defaultValue={widget.aspect}
              id={`aspect-${widget.id}`}
              name="aspect"
            >
              {BANNER_ASPECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor={`width-${widget.id}`}>
              Genişlik
            </label>
            <select
              className={inputClass}
              defaultValue={widget.banner_width}
              id={`width-${widget.id}`}
              name="bannerWidth"
            >
              {BANNER_WIDTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">
              Tam genişlikte görseller ekranın sağ ve sol kenarına yaslanır.
            </p>
          </div>
        </>
      ) : null}

      {isProcess ? (
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-800">
              Süreç adımları
            </p>
            <button
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={steps.length >= 8}
              onClick={() =>
                setSteps((current) =>
                  current.length >= 8
                    ? current
                    : [...current, { title: "", description: "" }]
                )
              }
              type="button"
            >
              + Adım ekle
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Başlıkta her satır yeni satıra denk gelir; *metin* italik vurgu
            olarak gösterilir.
          </p>
          <div className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <div
                className="grid gap-2 rounded-xl border border-zinc-200 p-3 sm:grid-cols-[1fr_2fr_auto]"
                key={index}
              >
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateStep(index, "title", event.target.value)
                  }
                  placeholder="Başlık"
                  value={step.title}
                />
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateStep(index, "description", event.target.value)
                  }
                  placeholder="Açıklama"
                  value={step.description}
                />
                <button
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  onClick={() =>
                    setSteps((current) =>
                      current.filter((_, position) => position !== index)
                    )
                  }
                  type="button"
                >
                  Sil
                </button>
                <input name="stepTitle" type="hidden" value={step.title} />
                <input
                  name="stepDescription"
                  type="hidden"
                  value={step.description}
                />
              </div>
            ))}
          </div>
          {steps.length === 0 ? (
            <p className="mt-2 text-xs font-medium text-red-600">
              En az bir adım ekleyin.
            </p>
          ) : null}
        </div>
      ) : null}

      {isSlider ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 sm:col-span-2">
          Hero görselleri{" "}
          <Link
            className="font-semibold text-orange-700 underline"
            href="/admin/slider"
          >
            Slider ekranından
          </Link>{" "}
          yönetilir.
        </div>
      ) : null}

      {isSeoText ? (
        <div className="space-y-3 sm:col-span-2">
          <div>
            <p className={labelClass}>Metin</p>
            <RichTextEditor
              initialContent={widget.config.seo?.content ?? ""}
              name="seoContent"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              className="h-4 w-4 accent-orange-600"
              defaultChecked={widget.config.seo?.collapsedByDefault ?? true}
              name="collapsedByDefault"
              type="checkbox"
            />
            Kapalı başlasın
          </label>
          <p className="text-xs text-zinc-400">
            Kapalı başladığında yalnızca metnin üst kısmı görünür, altta
            karararak biter. İşaretsizse ana sayfada açık gelir.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm font-medium text-red-600 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600 sm:col-span-2">
          {state.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

function NewBannerForm({ widgetId }: { widgetId: number }) {
  const [state, formAction, pending] = useActionState(
    saveHomeBannerAction,
    {}
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-dashed border-zinc-300 bg-white p-4"
    >
      <input name="widgetId" type="hidden" value={widgetId} />
      <input name="bannerId" type="hidden" value={0} />
      <p className="text-sm font-semibold text-zinc-800">Yeni görsel ekle</p>

      <div className="grid gap-3 sm:grid-cols-2" key={state.nonce ?? "new"}>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor={`new-banner-image-${widgetId}`}>
            Görsel *
          </label>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block w-full max-w-sm text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
            id={`new-banner-image-${widgetId}`}
            name="image"
            required
            type="file"
          />
          <p className="mt-1 text-xs text-zinc-400">
            JPEG, PNG, WEBP, GIF veya AVIF • en fazla 5 MB
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor={`new-banner-alt-${widgetId}`}>
            Alt metin
          </label>
          <input
            className={inputClass}
            id={`new-banner-alt-${widgetId}`}
            name="altText"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`new-banner-link-${widgetId}`}>
            Bağlantı
          </label>
          <input
            className={inputClass}
            id={`new-banner-link-${widgetId}`}
            name="link"
            placeholder="/kategori/... veya https://..."
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            name="openInNewTab"
            type="checkbox"
          />
          Yeni sekmede aç
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked
            name="active"
            type="checkbox"
          />
          Aktif
        </label>
      </div>

      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}
      {state.ok && state.message ? (
        <p className="text-sm font-medium text-emerald-600">{state.message}</p>
      ) : null}

      <button
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Yükleniyor..." : "Görsel Ekle"}
      </button>
    </form>
  );
}

function BannerRow({
  banner,
  canMoveUp,
  canMoveDown,
  disabled,
  onMove,
}: {
  banner: HomeWidgetBanner;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  onMove: (bannerId: number, direction: -1 | 1) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveHomeBannerAction,
    {}
  );
  const [preview, setPreview] = useState<string | null>(null);
  const busy = pending || disabled;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={banner.alt_text ?? "Banner görseli"}
          className={`h-14 w-20 shrink-0 rounded-lg border border-zinc-200 object-cover ${
            banner.active === 1 ? "" : "grayscale"
          }`}
          src={preview ?? banner.image_url}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {banner.alt_text || "Banner görseli"}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {banner.link || "Bağlantı yok"}
          </p>
        </div>

        <span className="text-xs font-medium text-zinc-500">
          {banner.active === 1 ? "Aktif" : "Pasif"}
        </span>

        <div className="flex items-center gap-1">
          <button
            aria-label="Yukarı taşı"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canMoveUp || busy}
            onClick={() => onMove(banner.id, -1)}
            type="button"
          >
            <ChevronIcon direction="up" />
          </button>
          <button
            aria-label="Aşağı taşı"
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canMoveDown || busy}
            onClick={() => onMove(banner.id, 1)}
            type="button"
          >
            <ChevronIcon direction="down" />
          </button>
        </div>

        <form
          action={deleteHomeBannerAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Bu banner görseli silinsin mi? Bu işlem geri alınamaz."
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="bannerId" type="hidden" value={banner.id} />
          <button
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            type="submit"
          >
            Sil
          </button>
        </form>
      </div>

      <form
        action={formAction}
        className="grid gap-3 border-t border-zinc-200 p-3 sm:grid-cols-2"
      >
        <input name="widgetId" type="hidden" value={banner.widget_id} />
        <input name="bannerId" type="hidden" value={banner.id} />

        <div className="sm:col-span-2">
          <label
            className={labelClass}
            htmlFor={`banner-image-${banner.id}`}
          >
            Görsel değiştir
          </label>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block w-full max-w-sm text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
            id={`banner-image-${banner.id}`}
            name="image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
            type="file"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Boş bırakılırsa mevcut görsel korunur.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor={`banner-alt-${banner.id}`}>
            Alt metin
          </label>
          <input
            className={inputClass}
            defaultValue={banner.alt_text ?? ""}
            id={`banner-alt-${banner.id}`}
            name="altText"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`banner-link-${banner.id}`}>
            Bağlantı
          </label>
          <input
            className={inputClass}
            defaultValue={banner.link ?? ""}
            id={`banner-link-${banner.id}`}
            name="link"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={banner.open_in_new_tab === 1}
            name="openInNewTab"
            type="checkbox"
          />
          Yeni sekmede aç
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            className="h-4 w-4 accent-orange-600"
            defaultChecked={banner.active === 1}
            name="active"
            type="checkbox"
          />
          Aktif
        </label>

        {state.error ? (
          <p className="text-sm font-medium text-red-600 sm:col-span-2">
            {state.error}
          </p>
        ) : null}
        {state.ok && state.message ? (
          <p className="text-sm font-medium text-emerald-600 sm:col-span-2">
            {state.message}
          </p>
        ) : null}

        <div className="sm:col-span-2">
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

function BannerManager({ widget }: { widget: HomeWidgetWithBanners }) {
  const [isPending, startTransition] = useTransition();
  const banners = widget.banners;
  const layout = widget.banner_layout;
  const overCapacity = banners.length > layout;

  function move(bannerId: number, direction: -1 | 1) {
    const ids = banners.map((banner) => banner.id);
    const index = ids.indexOf(bannerId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;

    [ids[index], ids[target]] = [ids[target], ids[index]];
    startTransition(async () => {
      await reorderHomeBannersAction(widget.id, ids);
    });
  }

  return (
    <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-zinc-800">Banner Görselleri</p>
        <span
          className={`text-xs font-semibold ${
            overCapacity ? "text-red-600" : "text-zinc-500"
          }`}
        >
          {banners.length} / {layout} görsel
        </span>
      </div>

      {overCapacity ? (
        <p className="text-xs font-medium text-red-600">
          Fazla görseller ana sayfada gösterilmez. Silin veya düzeni artırın.
        </p>
      ) : null}

      {banners.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-center text-sm text-zinc-500">
          Henüz görsel yok.
        </p>
      ) : null}

      {banners.map((banner, index) => (
        <BannerRow
          banner={banner}
          canMoveDown={index < banners.length - 1}
          canMoveUp={index > 0}
          disabled={isPending}
          key={banner.id}
          onMove={move}
        />
      ))}

      {banners.length < layout ? (
        <NewBannerForm widgetId={widget.id} />
      ) : (
        <p className="text-xs text-zinc-500">
          Kapasite dolu. Yeni görsel için önce birini silin veya düzeni artırın.
        </p>
      )}
    </div>
  );
}

export function HomeWidgetManager({
  collections,
  widgets,
}: {
  collections: Collection[];
  widgets: HomeWidgetWithBanners[];
}) {
  const [optimisticWidgets, applyOptimistic] = useOptimistic(
    widgets,
    reduceWidgets
  );
  const [isPending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  function persistOrder(ids: number[]) {
    startTransition(async () => {
      applyOptimistic({ type: "reorder", ids });
      await reorderHomeWidgetsAction(ids);
    });
  }

  function move(widgetId: number, direction: -1 | 1) {
    const ids = optimisticWidgets.map((widget) => widget.id);
    const index = ids.indexOf(widgetId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persistOrder(ids);
  }

  function dropOn(targetId: number) {
    setDragOverId(null);
    if (dragId === null || dragId === targetId) return;

    const ids = optimisticWidgets.map((widget) => widget.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);
    persistOrder(ids);
  }

  function toggle(widget: HomeWidgetWithBanners) {
    const next = widget.active !== 1;
    startTransition(async () => {
      applyOptimistic({ type: "toggle", id: widget.id, active: next });
      await toggleHomeWidgetActiveAction(widget.id, next);
    });
  }

  return (
    <div className="space-y-6">
      <AddWidgetForm collections={collections} />

      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          Sıralamayı değiştirmek için tutamaçtan sürükleyin veya ok butonlarını
          kullanın.
        </p>

        {optimisticWidgets.map((widget, index) => {
          const meta = HOME_WIDGET_META[widget.type];
          const collectionName = collections.find(
            (collection) =>
              collection.id === widget.config.collection?.collectionId
          )?.name;

          return (
            <div
              className={`rounded-2xl border bg-white transition ${
                dragOverId === widget.id
                  ? "border-orange-400 ring-2 ring-orange-200"
                  : "border-zinc-200"
              } ${dragId === widget.id ? "opacity-60" : ""}`}
              key={widget.id}
              onDragLeave={() =>
                setDragOverId((current) =>
                  current === widget.id ? null : current
                )
              }
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverId(widget.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                dropOn(widget.id);
              }}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  aria-label="Sürükleyerek sırala"
                  className="cursor-grab rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing"
                  draggable
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(widget.id));
                    setDragId(widget.id);
                  }}
                  type="button"
                >
                  <GripIcon />
                </button>

                {widget.type === "banner" && widget.banners[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className={`h-14 w-20 shrink-0 rounded-lg border border-zinc-200 object-cover ${
                      widget.active === 1 ? "" : "grayscale"
                    }`}
                    src={widget.banners[0].image_url}
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {meta.label}
                    </span>
                    {widget.active === 1 ? null : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        Pasif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-900">
                    {widgetTitle(widget)}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {widgetSummary(widget, collectionName)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    aria-label="Yukarı taşı"
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={index === 0 || isPending}
                    onClick={() => move(widget.id, -1)}
                    type="button"
                  >
                    <ChevronIcon direction="up" />
                  </button>
                  <button
                    aria-label="Aşağı taşı"
                    className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={
                      index === optimisticWidgets.length - 1 || isPending
                    }
                    onClick={() => move(widget.id, 1)}
                    type="button"
                  >
                    <ChevronIcon direction="down" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    active={widget.active === 1}
                    disabled={isPending}
                    label={
                      widget.active === 1
                        ? "Widget'ı pasif yap"
                        : "Widget'ı aktif yap"
                    }
                    onToggle={() => toggle(widget)}
                  />
                  <span className="w-12 text-xs font-medium text-zinc-500">
                    {widget.active === 1 ? "Aktif" : "Pasif"}
                  </span>
                </div>

                <button
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  onClick={() =>
                    setEditingId((current) =>
                      current === widget.id ? null : widget.id
                    )
                  }
                  type="button"
                >
                  {editingId === widget.id ? "Kapat" : "Düzenle"}
                </button>

                <form
                  action={deleteHomeWidgetAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        "Bu widget silinsin mi? Banner görselleri de kalıcı olarak silinir."
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input name="widgetId" type="hidden" value={widget.id} />
                  <button
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    type="submit"
                  >
                    Sil
                  </button>
                </form>
              </div>

              {editingId === widget.id ? (
                <>
                  <WidgetEditForm
                    collections={collections}
                    widget={widget}
                  />
                  {widget.type === "banner" ? (
                    <BannerManager widget={widget} />
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}

        {optimisticWidgets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            Henüz widget yok. Yukarıdaki formdan ilkini ekleyin.
          </p>
        ) : null}
      </div>
    </div>
  );
}
