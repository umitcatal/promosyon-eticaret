import { CategoryTreeNav } from "@/components/catalog/category-tree-nav";
import type { CategoryTreeItem } from "@/lib/types";

function countDescendants(node: CategoryTreeItem): number {
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0
  );
}

function containsSlug(node: CategoryTreeItem, slug: string): boolean {
  if (node.slug === slug) return true;
  return node.children.some((child) => containsSlug(child, slug));
}

export function CategorySidebar({
  nodes,
  total,
  activeSlug,
}: {
  nodes: CategoryTreeItem[];
  total: number;
  activeSlug: string | null;
}) {
  const activeTop = activeSlug
    ? (nodes.find((node) => containsSlug(node, activeSlug)) ?? null)
    : null;
  const subgroupCount = nodes.reduce(
    (sum, node) => sum + countDescendants(node),
    0
  );

  return (
    <>
      <details className="group mb-8 overflow-hidden rounded-sm border border-line bg-paper lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-baseline gap-3">
            <span className="eyebrow shrink-0">Kategoriler</span>
            {activeTop ? (
              <span className="min-w-0 truncate font-display text-[13px] font-medium text-ink">
                {activeTop.name}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                {nodes.length} grup
              </span>
            )}
          </span>
          <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-ink-muted transition-transform duration-300 ease-out group-open:rotate-180">
            <svg
              aria-hidden="true"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <path
                d="m6 9 6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </summary>
        <div className="border-t border-line px-3 pb-1">
          <CategoryTreeNav
            activeSlug={activeSlug}
            key={activeSlug ?? "all"}
            nodes={nodes}
            total={total}
          />
        </div>
      </details>

      <aside
        aria-label="Katalog menüsü"
        className="hidden lg:sticky lg:top-28 lg:block lg:self-start"
      >
        <div className="flex max-h-[calc(100vh-8rem)] flex-col">
          <div className="flex shrink-0 items-baseline justify-between gap-3 border-b-2 border-ink pb-3">
            <p className="eyebrow">Katalog İndeksi</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {total} ürün
            </span>
          </div>
          <nav
            aria-label="Kategori ağacı"
            className="catalog-sidebar min-h-0 flex-1 overflow-y-auto pr-1"
          >
            <CategoryTreeNav
              activeSlug={activeSlug}
              key={activeSlug ?? "all"}
              nodes={nodes}
              total={total}
            />
          </nav>
          <p className="shrink-0 pt-4 pl-3.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted/70">
            {nodes.length} grup · {subgroupCount} alt grup
          </p>
        </div>
      </aside>
    </>
  );
}
