import Link from "next/link";
import type { HomeWidgetWithBanners } from "@/lib/types";

export const TITLE_CLASS =
  "mt-3 font-display text-3xl leading-none font-semibold tracking-tight sm:text-4xl lg:text-5xl";

export type WidgetHeadingTexts = Pick<
  HomeWidgetWithBanners,
  "eyebrow" | "title" | "subtitle"
>;

export function WidgetHeading({
  widget,
  eyebrowClassName = "eyebrow",
  titleClassName = TITLE_CLASS,
  subtitleClassName = "mt-4 max-w-2xl text-sm leading-6 text-ink-muted",
}: {
  widget: WidgetHeadingTexts;
  eyebrowClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  if (!widget.eyebrow && !widget.title && !widget.subtitle) return null;

  return (
    <div>
      {widget.eyebrow ? (
        <p className={eyebrowClassName}>{widget.eyebrow}</p>
      ) : null}
      {widget.title ? <h2 className={titleClassName}>{widget.title}</h2> : null}
      {widget.subtitle ? (
        <p className={subtitleClassName}>{widget.subtitle}</p>
      ) : null}
    </div>
  );
}

export function WidgetLink({
  link,
  label,
  className = "",
}: {
  link: string | null;
  label: string | null;
  className?: string;
}) {
  if (!link || !label) return null;

  return (
    <Link
      className={`group inline-flex items-center gap-2 border-b border-line-strong pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700 ${className}`}
      href={link}
    >
      {label}
      <span
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
