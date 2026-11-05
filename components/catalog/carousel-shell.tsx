"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

function scrollAmount(
  element: HTMLUListElement,
  step: "item" | "page"
): number {
  if (step === "page") return Math.max(1, element.clientWidth);

  const first = element.children[0] as HTMLElement | undefined;
  const second = element.children[1] as HTMLElement | undefined;
  if (!first) return Math.max(1, element.clientWidth);

  const distance = second
    ? second.offsetLeft - first.offsetLeft
    : first.offsetWidth;
  return Math.max(1, distance);
}

export function CarouselShell({
  children,
  className,
  label,
  arrowsOnMobile = false,
  autoplay = false,
  autoplayInterval = 5,
  step = "page",
}: {
  children: ReactNode;
  className: string;
  label: string;
  arrowsOnMobile?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  step?: "item" | "page";
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const update = () => {
      setCanPrev(element.scrollLeft > 4);
      setCanNext(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 4
      );
    };

    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = listRef.current;
    if (!element || !autoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const delay = Math.max(2, Math.trunc(autoplayInterval)) * 1000;
    let paused = false;
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };

    element.addEventListener("pointerenter", pause);
    element.addEventListener("pointerleave", resume);
    element.addEventListener("focusin", pause);
    element.addEventListener("focusout", resume);
    element.addEventListener("touchstart", pause, { passive: true });
    element.addEventListener("touchend", resume);

    const timer = window.setInterval(() => {
      if (paused || element.scrollWidth <= element.clientWidth) return;

      if (
        element.scrollLeft + element.clientWidth >=
        element.scrollWidth - 4
      ) {
        element.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      element.scrollBy({
        left: scrollAmount(element, step),
        behavior: "smooth",
      });
    }, delay);

    return () => {
      window.clearInterval(timer);
      element.removeEventListener("pointerenter", pause);
      element.removeEventListener("pointerleave", resume);
      element.removeEventListener("focusin", pause);
      element.removeEventListener("focusout", resume);
      element.removeEventListener("touchstart", pause);
      element.removeEventListener("touchend", resume);
    };
  }, [autoplay, autoplayInterval, step]);

  function scroll(direction: -1 | 1) {
    const element = listRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * scrollAmount(element, step),
      behavior: "smooth",
    });
  }

  return (
    <div>
      <ul className={className} ref={listRef}>
        {children}
      </ul>
      <div
        className={`mt-4 ${
          arrowsOnMobile ? "flex" : "hidden lg:flex"
        } justify-end gap-2`}
      >
        <button
          aria-label={`${label} — önceki ürünler`}
          className="inline-flex size-9 items-center justify-center rounded-sm border border-line-strong text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canPrev}
          onClick={() => scroll(-1)}
          type="button"
        >
          ←
        </button>
        <button
          aria-label={`${label} — sonraki ürünler`}
          className="inline-flex size-9 items-center justify-center rounded-sm border border-line-strong text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canNext}
          onClick={() => scroll(1)}
          type="button"
        >
          →
        </button>
      </div>
    </div>
  );
}
