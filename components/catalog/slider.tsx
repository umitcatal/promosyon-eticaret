"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

export type Slide = {
  id: number;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
};

const DWELL_MS = 6000;

/* Banners are 2092x752 with the headline and its own CTA baked into the left
 * third, so the frame keeps the source ratio from `sm` up and anchors the crop
 * to the left on phones instead of slicing the headline away. */
const FRAME_CLASS =
  "relative aspect-[1.6/1] w-full overflow-hidden bg-ink sm:aspect-[2.78/1]";
const IMAGE_CLASS = "object-cover object-left sm:object-center";

export function Slider({
  slides,
  eyebrow,
}: {
  slides: Slide[];
  eyebrow?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedSlides, setFailedSlides] = useState<number[]>([]);

  const go = useCallback(
    (index: number) => {
      setActive((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, DWELL_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const current = slides[active];
  const hasCaption = Boolean(current?.title || current?.subtitle);

  return (
    <section
      aria-label="Öne çıkan koleksiyonlar"
      aria-roledescription="carousel"
      className="w-full overflow-hidden rounded-sm border border-line bg-paper"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={FRAME_CLASS}>
        {/* Full-bleed banners carry baked-in headlines, so slides wipe instead
         * of dissolving — a crossfade doubles two headlines into one. */}
        <motion.div
          animate={{ x: `-${active * 100}%` }}
          className="absolute inset-0 flex"
          initial={false}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {slides.map((slide, index) => {
            const isActive = index === active;
            const failed = failedSlides.includes(slide.id);

            return (
              <div
                aria-hidden={!isActive}
                className="relative h-full w-full shrink-0"
                key={slide.id}
              >
                {failed ? (
                  <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_10%,#1b2a22_0%,#14130f_60%)]" />
                ) : (
                  <motion.div
                    animate={{ scale: isActive ? [1, 1.06] : 1 }}
                    className="absolute inset-0 origin-left sm:origin-center"
                    transition={{
                      duration: isActive ? DWELL_MS / 1000 : 0.9,
                      ease: "linear",
                    }}
                  >
                    <Image
                      alt={slide.title ?? "Promosyon ürünleri"}
                      className={IMAGE_CLASS}
                      fill
                      fetchPriority={index === 0 ? "high" : "low"}
                      loading={index === 0 ? undefined : "eager"}
                      onError={() =>
                        setFailedSlides((list) =>
                          list.includes(slide.id)
                            ? list
                            : [...list, slide.id]
                        )
                      }
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, 1280px"
                      src={slide.image_url}
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          {hasCaption && current ? (
            <motion.div
              className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/85 via-ink/30 to-transparent p-6 sm:p-10 lg:p-14"
              initial={{ opacity: 0, y: 18 }}
              key={current.id}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="eyebrow text-brass-300">
                {eyebrow?.trim() || "Kurumsal Promosyon"}
              </span>
              {current.title ? (
                <h2 className="mt-3 max-w-2xl font-display text-[1.75rem] leading-[1.05] font-semibold text-paper sm:text-4xl lg:text-[3.25rem]">
                  {current.title}
                </h2>
              ) : null}
              {current.subtitle ? (
                <p className="mt-3 max-w-lg text-sm leading-6 text-paper/75 sm:text-base">
                  {current.subtitle}
                </p>
              ) : null}
              {current.link ? (
                <Link
                  className="mt-6 inline-flex w-fit items-center gap-3 border-b border-brass-300/60 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper transition-colors hover:border-brass-300 hover:text-brass-200"
                  href={current.link}
                >
                  Keşfedin
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {slides.length > 1 ? (
        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 sm:px-5">
          <span className="font-mono text-[10px] tracking-[0.16em] text-ink-muted">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>
          <div className="flex flex-1 gap-1.5">
            {slides.map((slide, index) => (
              <button
                aria-current={index === active}
                aria-label={`${index + 1}. görsele git`}
                className="group relative h-0.5 flex-1 overflow-hidden bg-ink/12"
                key={slide.id}
                onClick={() => go(index)}
                type="button"
              >
                <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/20" />
                {index === active ? (
                  <motion.span
                    animate={{ scaleX: 1 }}
                    className="absolute inset-0 origin-left bg-brass-500"
                    initial={{ scaleX: 0 }}
                    key={`fill-${slide.id}-${paused ? "p" : "r"}`}
                    transition={{
                      duration: paused ? 0 : DWELL_MS / 1000,
                      ease: "linear",
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              aria-label="Önceki görsel"
              className="flex size-8 items-center justify-center rounded-sm border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
              onClick={() => go(active - 1)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="m15 6-6 6 6 6" strokeLinecap="round" />
              </svg>
            </button>
            <button
              aria-label="Sonraki görsel"
              className="flex size-8 items-center justify-center rounded-sm border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
              onClick={() => go(active + 1)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="m9 6 6 6-6 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function HeroFallback() {
  return (
    <section className="relative overflow-hidden rounded-sm border border-line bg-ink px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(90% 70% at 82% 18%, rgba(217,180,91,0.16) 0%, rgba(20,19,15,0) 60%), radial-gradient(70% 60% at 10% 90%, rgba(37,106,78,0.28) 0%, rgba(20,19,15,0) 65%)",
        }}
      />
      <div className="relative max-w-3xl">
        <p className="eyebrow text-brass-300">Kurumsal Promosyon Ürünleri</p>
        <h1 className="mt-5 font-display text-[2.1rem] leading-[1.02] font-semibold text-paper sm:text-5xl lg:text-[4rem]">
          Markanızı
          <span className="block text-brass-200 italic">binlerce ürüne</span>
          taşıyın.
        </h1>
        <p className="mt-6 max-w-lg text-sm leading-7 text-paper/70 sm:text-base">
          Kalemden teknolojiye, çantadan kupaya yüzlerce promosyon ürünü.
          Kurumsal baskı ve özelleştirme için koleksiyonumuza göz atın.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <Link
            className="inline-flex items-center gap-3 rounded-sm bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-brass-200"
            href="#kategoriler"
          >
            Kategorileri İnceleyin
          </Link>
          <Link
            className="inline-flex items-center gap-2 border-b border-paper/30 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/80 transition-colors hover:border-brass-300 hover:text-brass-200"
            href="/urunler"
          >
            Tüm Ürünler
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
