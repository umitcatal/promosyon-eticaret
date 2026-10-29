"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type Slide = {
  id: number;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
};

export function Slider({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const [failedSlides, setFailedSlides] = useState<number[]>([]);

  const go = useCallback(
    (index: number) => {
      setActive((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative h-[240px] w-full overflow-hidden rounded-2xl bg-zinc-900 sm:h-[340px] lg:h-[440px]">
      {slides.map((slide, index) => (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          key={slide.id}
        >
          {failedSlides.includes(slide.id) ? (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900" />
          ) : (
            <Image
              alt={slide.title ?? "Promosyon ürünleri"}
              className="object-cover"
              fill
              onError={() =>
                setFailedSlides((current) =>
                  current.includes(slide.id)
                    ? current
                    : [...current, slide.id]
                )
              }
              priority={index === 0}
              sizes="100vw"
              src={slide.image_url}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/75 via-zinc-950/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14">
            {slide.title ? (
              <h2 className="max-w-xl text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                {slide.title}
              </h2>
            ) : null}
            {slide.subtitle ? (
              <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-200 sm:text-base">
                {slide.subtitle}
              </p>
            ) : null}
            {slide.link ? (
              <Link
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500"
                href={slide.link}
              >
                Hemen Keşfet
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>
      ))}

      {slides.length > 1 ? (
        <>
          <button
            aria-label="Önceki görsel"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 sm:flex"
            onClick={() => go(active - 1)}
            type="button"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m15 6-6 6 6 6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            aria-label="Sonraki görsel"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 sm:flex"
            onClick={() => go(active + 1)}
            type="button"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m9 6 6 6-6 6" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                aria-label={`${index + 1}. görsele git`}
                className={`h-2 rounded-full transition-all ${
                  index === active
                    ? "w-6 bg-orange-500"
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
                key={slide.id}
                onClick={() => go(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function HeroFallback() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900 px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
          Kurumsal Promosyon Ürünleri
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
          Markanızı binlerce ürüne taşıyın
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-300 sm:text-base">
          Kalemden teknolojiye, çantadan kupaya yüzlerce promosyon ürünü.
          Kurumsal baskı ve özelleştirme için hemen keşfedin.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
            href="#kategoriler"
          >
            Kategorileri Keşfet
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            href="/arama?q=kalem"
          >
            Ürün Ara
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-24 h-80 w-80 rounded-full bg-orange-400/20 blur-3xl" />
    </section>
  );
}
