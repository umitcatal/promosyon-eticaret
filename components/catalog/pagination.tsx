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

  const linkClass =
    "flex h-10 min-w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-orange-400 hover:text-orange-600";

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link className={linkClass} href={href(page - 1)}>
          Önceki
        </Link>
      ) : null}

      {pages[0] !== 1 ? (
        <>
          <Link className={linkClass} href={href(1)}>
            1
          </Link>
          {pages[0] > 2 ? <span className="px-1 text-zinc-400">…</span> : null}
        </>
      ) : null}

      {pages.map((candidate) => (
        <Link
          className={
            candidate === page
              ? "flex h-10 min-w-10 items-center justify-center rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white"
              : linkClass
          }
          href={href(candidate)}
          key={candidate}
        >
          {candidate}
        </Link>
      ))}

      {pages[pages.length - 1] !== totalPages ? (
        <>
          {pages[pages.length - 1] < totalPages - 1 ? (
            <span className="px-1 text-zinc-400">…</span>
          ) : null}
          <Link className={linkClass} href={href(totalPages)}>
            {totalPages}
          </Link>
        </>
      ) : null}

      {page < totalPages ? (
        <Link className={linkClass} href={href(page + 1)}>
          Sonraki
        </Link>
      ) : null}
    </nav>
  );
}
