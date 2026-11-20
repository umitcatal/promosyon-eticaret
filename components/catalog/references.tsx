import Image from "next/image";
import type { CSSProperties } from "react";
import { REFERENCES_SPEED_DURATION_SECONDS } from "@/lib/home-widgets";
import { marqueeCopies, splitReferencesIntoRows } from "@/lib/references";
import type { ClientReference, HomeReferencesConfig } from "@/lib/types";

function referenceAlt(reference: ClientReference): string {
  return reference.name ?? "Referans logosu";
}

function ReferenceLogo({
  reference,
  eager = false,
}: {
  reference: ClientReference;
  eager?: boolean;
}) {
  return (
    <div className="flex h-20 w-32 items-center justify-center rounded-sm border border-line bg-paper px-4 transition-colors sm:h-24 sm:w-40">
      <div className="relative h-full w-full">
        <Image
          alt={referenceAlt(reference)}
          className="object-contain"
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 640px) 128px, 160px"
          src={reference.image_url}
          unoptimized={reference.image_url.startsWith("http")}
        />
      </div>
    </div>
  );
}

function MarqueeGroup({
  clone = false,
  eager = false,
  items,
}: {
  clone?: boolean;
  eager?: boolean;
  items: ClientReference[];
}) {
  const copies = marqueeCopies(items.length);

  return (
    <ul
      aria-hidden={clone ? true : undefined}
      className="marquee-group"
      data-marquee-clone={clone ? "" : undefined}
    >
      {items.map((reference) =>
        Array.from({ length: copies }, (_, copy) => (
          <li
            aria-hidden={copy > 0 ? true : undefined}
            data-marquee-copy={copy > 0 ? "" : undefined}
            key={`${reference.id}-${copy}`}
          >
            <ReferenceLogo eager={eager && copy === 0} reference={reference} />
          </li>
        ))
      )}
    </ul>
  );
}

export function ReferencesMarquee({
  config,
  references,
}: {
  config: HomeReferencesConfig;
  references: ClientReference[];
}) {
  const rows = splitReferencesIntoRows(references, config.rows);
  const duration = `${REFERENCES_SPEED_DURATION_SECONDS[config.speed]}s`;

  return (
    <>
      {rows.map((row, index) => {
        const direction = index % 2 === 0 ? "right" : "left";
        return (
          <div
            aria-label={`Referanslar ${index + 1}. sıra`}
            className="marquee"
            data-direction={direction}
            key={index}
            role="group"
          >
            <div
              className="marquee-track"
              style={{ "--marquee-duration": duration } as CSSProperties}
            >
              <MarqueeGroup eager items={row} />
              <MarqueeGroup clone items={row} />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function ReferencesGrid({
  references,
}: {
  references: ClientReference[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {references.map((reference) => (
        <li key={reference.id}>
          <figure className="h-full overflow-hidden rounded-sm border border-line bg-paper transition-colors hover:border-line-strong">
            <div className="relative aspect-[3/2]">
              <Image
                alt={referenceAlt(reference)}
                className="object-contain p-6 sm:p-8"
                fill
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                src={reference.image_url}
                unoptimized={reference.image_url.startsWith("http")}
              />
            </div>
            {reference.name ? (
              <figcaption className="border-t border-line px-4 py-3 text-center text-xs font-semibold tracking-[0.14em] text-ink-muted uppercase">
                {reference.name}
              </figcaption>
            ) : null}
          </figure>
        </li>
      ))}
    </ul>
  );
}
