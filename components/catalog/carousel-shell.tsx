"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function CarouselShell({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className: string;
  label: string;
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

  function scroll(direction: -1 | 1) {
    const element = listRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <ul className={className} ref={listRef}>
        {children}
      </ul>
      <div className="mt-4 hidden justify-end gap-2 lg:flex">
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
