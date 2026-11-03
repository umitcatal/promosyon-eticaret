import Link from "next/link";

export function Pagination({
  basePath,
  page,
  total,
  pageSize,
  query,
}: {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
  query?: Record<string, string>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function href(targetPage: number): string {
    const params = new URLSearchParams(query ?? {});
    if (targetPage > 1) params.set("sayfa", String(targetPage));
    else params.delete("sayfa");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages: number[] = [];
  for (
    let candidate = Math.max(1, page - 2);
    candidate <= Math.min(totalPages, page + 2);
    candidate += 1
  ) {
    pages.push(candidate);
  }

  const cellClass =
    "flex h-10 min-w-10 items-center justify-center rounded-sm border border-line bg-paper px-3 font-mono text-[12px] tracking-[0.08em] text-ink-muted transition-colors hover:border-ink hover:text-ink";
  const activeClass =
    "flex h-10 min-w-10 items-center justify-center rounded-sm border border-ink bg-ink px-3 font-mono text-[12px] tracking-[0.08em] text-paper";
  const stepClass =
    "flex h-10 items-center gap-2 rounded-sm border border-line bg-paper px-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink hover:bg-surface";

  return (
    <nav
      aria-label="Sayfalar"
      className="mt-12 flex flex-wrap items-center justify-center gap-1.5 border-t border-line pt-8"
    >
      {page > 1 ? (
        <Link className={stepClass} href={href(page - 1)}>
          <span aria-hidden="true">←</span> Önceki
        </Link>
      ) : null}

      {pages[0] !== 1 ? (
        <>
          <Link className={cellClass} href={href(1)}>
            1
          </Link>
          {pages[0] > 2 ? (
            <span className="px-1 font-mono text-[12px] text-line-strong">…</span>
          ) : null}
        </>
      ) : null}

      {pages.map((candidate) => (
        <Link
          aria-current={candidate === page ? "page" : undefined}
          className={candidate === page ? activeClass : cellClass}
          href={href(candidate)}
          key={candidate}
        >
          {String(candidate).padStart(2, "0")}
        </Link>
      ))}

      {pages[pages.length - 1] !== totalPages ? (
        <>
          {pages[pages.length - 1] < totalPages - 1 ? (
            <span className="px-1 font-mono text-[12px] text-line-strong">…</span>
          ) : null}
          <Link className={cellClass} href={href(totalPages)}>
            {String(totalPages).padStart(2, "0")}
          </Link>
        </>
      ) : null}

      {page < totalPages ? (
        <Link className={stepClass} href={href(page + 1)}>
          Sonraki <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </nav>
  );
}
