"use client";

import { useEffect, useRef, useState } from "react";

export function SeoTextBlock({
  collapsedByDefault,
  html,
  id,
}: {
  collapsedByDefault: boolean;
  html: string;
  id: number;
}) {
  const [open, setOpen] = useState(!collapsedByDefault);
  const [clipped, setClipped] = useState(collapsedByDefault);
  const clipRef = useRef<HTMLDivElement>(null);
  const regionId = `seo-text-${id}`;

  useEffect(() => {
    const element = clipRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setClipped(element.scrollHeight > element.clientHeight + 8);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div
        data-seo-collapse=""
        data-seo-open={open ? "true" : "false"}
        id={regionId}
        ref={clipRef}
      >
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {open || clipped ? (
        <button
          aria-controls={regionId}
          aria-expanded={open}
          className="mt-4 inline-flex items-center gap-2 border-b border-line-strong pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? "Daha az göster" : "Devamını oku"}
          <svg
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="m6 9 6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
