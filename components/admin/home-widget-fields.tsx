"use client";

import { inputClass, labelClass } from "@/components/ui/styles";
import {
  COLLECTION_AUTOPLAY_DEFAULT,
  COLLECTION_AUTOPLAY_MAX,
  COLLECTION_AUTOPLAY_MIN,
  COLLECTION_DESKTOP_OPTIONS,
  COLLECTION_MOBILE_LAYOUT_OPTIONS,
  COLLECTION_MOBILE_OPTIONS,
  COLLECTION_SLIDE_STEP_OPTIONS,
} from "@/lib/home-widgets";
import type { CarouselStyleConfig } from "@/lib/types";

export function CarouselStyleFields({
  config,
  idPrefix,
}: {
  config?: CarouselStyleConfig;
  idPrefix: string;
}) {
  return (
    <>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-desktop`}>
          Masaüstü görünüm
        </label>
        <select
          className={inputClass}
          defaultValue={config?.perViewDesktop ?? 4}
          id={`${idPrefix}-desktop`}
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
        <label className={labelClass} htmlFor={`${idPrefix}-mobile`}>
          Mobil görünüm
        </label>
        <select
          className={inputClass}
          defaultValue={config?.perViewMobile ?? 2}
          id={`${idPrefix}-mobile`}
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
        <label className={labelClass} htmlFor={`${idPrefix}-layout`}>
          Mobil düzen
        </label>
        <select
          className={inputClass}
          defaultValue={config?.mobileLayout ?? "slider"}
          id={`${idPrefix}-layout`}
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
            defaultChecked={config?.autoplay === true}
            name="autoplay"
            type="checkbox"
          />
          Otomatik oynatma
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              className={labelClass}
              htmlFor={`${idPrefix}-autoplay-interval`}
            >
              Oynatma aralığı (saniye)
            </label>
            <input
              className={inputClass}
              defaultValue={config?.autoplayInterval ?? COLLECTION_AUTOPLAY_DEFAULT}
              id={`${idPrefix}-autoplay-interval`}
              max={COLLECTION_AUTOPLAY_MAX}
              min={COLLECTION_AUTOPLAY_MIN}
              name="autoplayInterval"
              type="number"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${idPrefix}-step`}>
              Kaydırma adımı
            </label>
            <select
              className={inputClass}
              defaultValue={config?.slideStep ?? "page"}
              id={`${idPrefix}-step`}
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
          Otomatik oynatma yalnızca slider görünümünde çalışır; fare üzerine
          gelince ve dokunulduğunda duraklar.
        </p>
      </div>
    </>
  );
}
