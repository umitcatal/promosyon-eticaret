"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CategoryTreeItem } from "@/lib/types";

function ordinal(position: number): string {
  return String(position + 1).padStart(2, "0");
}

function findPath(nodes: CategoryTreeItem[], slug: string): number[] | null {
  for (const node of nodes) {
    if (node.slug === slug) return [node.id];
    const childPath = findPath(node.children, slug);
    if (childPath) return [node.id, ...childPath];
  }
  return null;
}

function Chevron({ open, className = "size-3" }: { open: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${className} transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Branch({
  node,
  index,
  depth,
  activePath,
  activeSlug,
  openIds,
  onToggle,
  idBase,
}: {
  node: CategoryTreeItem;
  index: number;
  depth: number;
  activePath: Set<number>;
  activeSlug: string | null;
  openIds: Set<number>;
  onToggle: (id: number) => void;
  idBase: string;
}) {
  const hasChildren = node.children.length > 0;
  const open = openIds.has(node.id);
  const active = node.slug === activeSlug;
  const inActivePath = activePath.has(node.id);
  const panelId = `${idBase}-${node.id}`;

  const toggleButton = (width: "top" | "child") => (
    <button
      aria-controls={panelId}
      aria-expanded={open}
      aria-label={`${node.name} alt gruplarını ${open ? "kapat" : "aç"}`}
      className={`${
        width === "top" ? "w-9 border-l border-line/70" : "w-8"
      } grid shrink-0 place-items-center text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500`}
      onClick={() => onToggle(node.id)}
      type="button"
    >
      <Chevron className={width === "top" ? "size-3" : "size-2.5"} open={open} />
    </button>
  );

  if (depth === 0) {
    return (
      <li className="border-b border-line">
        <div
          className={`relative flex items-stretch transition-colors ${
            inActivePath ? "bg-surface/70" : "hover:bg-surface/40"
          }`}
        >
          {inActivePath ? (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-0.5 bg-brass-500"
            />
          ) : null}
          <Link
            aria-current={active ? "page" : undefined}
            className="group flex min-w-0 flex-1 items-baseline gap-3 py-3 pr-1 pl-3.5"
            href={`/kategori/${node.slug}`}
          >
            <span
              className={`w-5 shrink-0 font-mono text-[10px] tracking-[0.12em] transition-colors ${
                inActivePath ? "text-brass-700" : "text-brass-600"
              }`}
            >
              {ordinal(index)}
            </span>
            <span
              className={`min-w-0 font-display text-[15px] leading-snug font-semibold transition-colors ${
                inActivePath
                  ? "text-brand-700"
                  : "text-ink group-hover:text-brand-700"
              }`}
            >
              {node.name}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-ink-muted">
              {node.product_count > 0 ? node.product_count : "—"}
            </span>
          </Link>
          {hasChildren ? toggleButton("top") : null}
        </div>

        <AnimatePresence initial={false}>
          {hasChildren && open ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
              exit={{ height: 0, opacity: 0 }}
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              key="panel"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ul className="ml-[1.9rem] border-l border-line py-1.5 pl-1">
                {node.children.map((child, childIndex) => (
                  <Branch
                    activePath={activePath}
                    activeSlug={activeSlug}
                    depth={1}
                    idBase={idBase}
                    index={childIndex}
                    key={child.id}
                    node={child}
                    onToggle={onToggle}
                    openIds={openIds}
                  />
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </li>
    );
  }

  return (
    <li>
      <div
        className={`flex items-stretch rounded-r-sm transition-colors ${
          active ? "bg-brand-50/70" : "hover:bg-surface/60"
        }`}
      >
        <Link
          aria-current={active ? "page" : undefined}
          className={`group flex min-w-0 flex-1 items-baseline gap-2.5 py-1.5 pr-1 pl-3.5 leading-snug transition-colors ${
            active
              ? "text-[13px] font-medium text-brand-700"
              : "text-[13px] text-ink-muted hover:text-ink"
          }`}
          href={`/kategori/${node.slug}`}
        >
          <span
            aria-hidden="true"
            className={`mt-[0.55em] size-1 shrink-0 rounded-full transition-colors ${
              active ? "bg-brand-600" : "bg-line-strong group-hover:bg-brass-500"
            }`}
          />
          <span className="min-w-0">{node.name}</span>
          {node.product_count > 0 ? (
            <span className="ml-auto shrink-0 font-mono text-[9px] tabular-nums text-ink-muted/80">
              {node.product_count}
            </span>
          ) : null}
        </Link>
        {hasChildren ? toggleButton("child") : null}
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && open ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            key="panel"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="mb-1 ml-6 border-l border-line py-1 pl-1">
              {node.children.map((child, childIndex) => (
                <Branch
                  activePath={activePath}
                  activeSlug={activeSlug}
                  depth={depth + 1}
                  idBase={idBase}
                  index={childIndex}
                  key={child.id}
                  node={child}
                  onToggle={onToggle}
                  openIds={openIds}
                />
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export function CategoryTreeNav({
  nodes,
  total,
  activeSlug,
}: {
  nodes: CategoryTreeItem[];
  total: number;
  activeSlug: string | null;
}) {
  const idBase = useId();
  const rootRef = useRef<HTMLUListElement | null>(null);

  const activePath = useMemo(() => {
    if (!activeSlug) return new Set<number>();
    return new Set(findPath(nodes, activeSlug) ?? []);
  }, [activeSlug, nodes]);

  const [openIds, setOpenIds] = useState<Set<number>>(() => {
    if (activePath.size > 0) return new Set(activePath);
    return new Set(nodes.length > 0 ? [nodes[0].id] : []);
  });

  useEffect(() => {
    if (!activeSlug) return;
    const root = rootRef.current;
    if (!root) return;

    function revealActive() {
      if (!root) return;
      const active = root.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) return;

      let scroller: HTMLElement | null = root.parentElement;
      while (scroller && scroller !== document.body) {
        const style = getComputedStyle(scroller);
        if (
          /(auto|scroll)/.test(style.overflowY) &&
          scroller.scrollHeight > scroller.clientHeight
        ) {
          break;
        }
        scroller = scroller.parentElement;
      }
      if (!scroller || scroller === document.body) return;

      const activeRect = active.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const margin = 24;
      const visibleTop = Math.max(scrollerRect.top, 0);
      const visibleBottom = Math.min(scrollerRect.bottom, window.innerHeight);

      let delta = 0;
      if (activeRect.bottom > visibleBottom - margin) {
        delta = activeRect.bottom - visibleBottom + margin;
      } else if (activeRect.top < visibleTop + margin) {
        delta = activeRect.top - visibleTop - margin;
      } else {
        return;
      }

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      scroller.scrollTo({
        behavior: reduced ? "auto" : "smooth",
        top: Math.max(0, scroller.scrollTop + delta),
      });
    }

    // Groups animate open on mount, so retry once their height has settled.
    const frame = requestAnimationFrame(revealActive);
    const timer = setTimeout(revealActive, 450);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [activeSlug]);

  function toggle(id: number) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allActive = activeSlug === null;

  return (
    <ul ref={rootRef}>
      <li className="border-b border-line">
        <Link
          aria-current={allActive ? "page" : undefined}
          className={`group relative flex items-baseline gap-3 py-3 pr-3 pl-3.5 transition-colors ${
            allActive ? "bg-surface/70" : "hover:bg-surface/40"
          }`}
          href="/urunler"
        >
          {allActive ? (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-0.5 bg-brass-500"
            />
          ) : null}
          <span
            className={`w-5 shrink-0 font-mono text-[10px] tracking-[0.12em] ${
              allActive ? "text-brass-700" : "text-brass-600"
            }`}
          >
            00
          </span>
          <span
            className={`min-w-0 font-display text-[15px] leading-snug font-semibold transition-colors ${
              allActive ? "text-brand-700" : "text-ink group-hover:text-brand-700"
            }`}
          >
            Tüm Ürünler
          </span>
          <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-ink-muted">
            {total}
          </span>
        </Link>
      </li>

      {nodes.map((node, index) => (
        <Branch
          activePath={activePath}
          activeSlug={activeSlug}
          depth={0}
          idBase={idBase}
          index={index}
          key={node.id}
          node={node}
          onToggle={toggle}
          openIds={openIds}
        />
      ))}
    </ul>
  );
}
