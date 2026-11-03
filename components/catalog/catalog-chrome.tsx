import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = { href?: string; label: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="İz" className="border-b border-line pb-4">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
              {index > 0 ? (
                <span aria-hidden="true" className="text-brass-500">
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  className="text-ink-muted transition-colors hover:text-brand-700"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "line-clamp-1 text-ink" : "text-ink-muted"}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function CatalogHeading({
  aside,
  eyebrow,
  meta,
  title,
}: {
  aside?: ReactNode;
  eyebrow: string;
  meta: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 pb-7">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-[2rem] leading-none font-semibold tracking-tight text-ink text-balance sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">
          {meta}
        </p>
        {aside}
      </div>
    </div>
  );
}
