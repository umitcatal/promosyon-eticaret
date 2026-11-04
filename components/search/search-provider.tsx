"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { normalizeSearchQuery } from "@/lib/search-fold";
import type { SearchTypeaheadResult } from "@/lib/types";
import { SearchOverlay } from "./search-overlay";

export type SearchSource = "desktop" | "mobile";
export type SearchStatus = "idle" | "loading" | "success" | "error";

type SearchOption = { key: string; href: string };

type SearchContextValue = {
  open: boolean;
  source: SearchSource | null;
  query: string;
  normalizedQuery: string;
  setQuery: (value: string) => void;
  openSearch: (source: SearchSource, trigger?: HTMLElement | null) => void;
  closeSearch: (options?: { restoreFocus?: boolean }) => void;
  status: SearchStatus;
  data: SearchTypeaheadResult | null;
  currentData: SearchTypeaheadResult | null;
  displayData: SearchTypeaheadResult | null;
  retry: () => void;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
  moveActive: (delta: 1 | -1) => void;
  handleInputKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  submitAll: () => void;
  options: SearchOption[];
  optionId: (key: string) => string;
  listboxId: string;
  liveMessage: string;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const value = useContext(SearchContext);
  if (!value) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return value;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const listboxId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<SearchSource | null>(null);
  const [query, setQueryState] = useState("");
  const [data, setData] = useState<SearchTypeaheadResult | null>(null);
  const [errorQuery, setErrorQuery] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const normalizedQuery = normalizeSearchQuery(query);
  const currentData =
    data && data.query === normalizedQuery ? data : null;
  const displayData = currentData ?? data;

  const status: SearchStatus =
    normalizedQuery.length < 2
      ? "idle"
      : currentData
        ? "success"
        : errorQuery === normalizedQuery
          ? "error"
          : "loading";

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setActiveKey(null);
  }, []);

  const closeSearch = useCallback(
    (options?: { restoreFocus?: boolean }) => {
      setOpen(false);
      setActiveKey(null);

      const trigger = triggerRef.current;
      if (
        options?.restoreFocus &&
        trigger &&
        trigger.isConnected &&
        trigger.getClientRects().length > 0
      ) {
        trigger.focus();
      }
    },
    []
  );

  const openSearch = useCallback(
    (nextSource: SearchSource, trigger?: HTMLElement | null) => {
      if (trigger) triggerRef.current = trigger;
      setSource(nextSource);
      setOpen(true);
    },
    []
  );

  const retry = useCallback(() => {
    setErrorQuery(null);
    setRetryToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!open || normalizedQuery.length < 2) return;
    if (data?.query === normalizedQuery) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setErrorQuery(null);

      fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("search failed");
          return (await response.json()) as SearchTypeaheadResult;
        })
        .then((result) => {
          if (controller.signal.aborted) return;
          setData(result);
          setErrorQuery(null);
          setActiveKey(null);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setErrorQuery(normalizedQuery);
        });
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [data, normalizedQuery, open, retryToken]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeSearch({ restoreFocus: true });
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeSearch, open]);

  useEffect(() => {
    if (!open) return;

    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setOpen(false);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("a[href]")) return;
      closeSearch();
    };

    const onPopState = () => closeSearch();

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [closeSearch, open]);

  const options = useMemo<SearchOption[]>(() => {
    if (!currentData) return [];

    const items: SearchOption[] = currentData.categories.map((category) => ({
      key: `cat:${category.id}`,
      href: `/kategori/${category.slug}`,
    }));

    for (const product of currentData.products) {
      items.push({ key: `prd:${product.id}`, href: `/urun/${product.slug}` });
    }

    if (currentData.productTotal > 0) {
      items.push({
        key: "all",
        href: `/arama?q=${encodeURIComponent(currentData.query)}`,
      });
    }

    return items;
  }, [currentData]);

  const optionId = useCallback(
    (key: string) => `${listboxId}-${key.replace(/:/g, "-")}`,
    [listboxId]
  );

  const moveActive = useCallback(
    (delta: 1 | -1) => {
      if (options.length === 0) return;

      setActiveKey((current) => {
        if (!current) {
          return delta === 1
            ? options[0].key
            : options[options.length - 1].key;
        }

        const index = options.findIndex((option) => option.key === current);
        if (index === -1) {
          return delta === 1
            ? options[0].key
            : options[options.length - 1].key;
        }

        const next = (index + delta + options.length) % options.length;
        return options[next].key;
      });
    },
    [options]
  );

  useEffect(() => {
    if (!activeKey) return;
    document
      .getElementById(optionId(activeKey))
      ?.scrollIntoView({ block: "nearest" });
  }, [activeKey, optionId]);

  const submitActive = useCallback(() => {
    const option = options.find((item) => item.key === activeKey);
    if (!option) return;

    closeSearch();
    router.push(option.href);
  }, [activeKey, closeSearch, options, router]);

  const submitAll = useCallback(() => {
    closeSearch();
    router.push(`/arama?q=${encodeURIComponent(normalizedQuery)}`);
  }, [closeSearch, normalizedQuery, router]);

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        if (!open) return;
        event.preventDefault();
        closeSearch({ restoreFocus: true });
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (normalizedQuery.length < 2) return;
        event.preventDefault();
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }

      if (event.key === "Enter" && activeKey) {
        event.preventDefault();
        submitActive();
      }
    },
    [
      activeKey,
      closeSearch,
      moveActive,
      normalizedQuery.length,
      open,
      submitActive,
    ]
  );

  const liveMessage = useMemo(() => {
    if (!open) return "";
    if (normalizedQuery.length < 2) {
      return "Aramak için en az 2 karakter girin.";
    }
    if (status === "error") return "Arama yapılamadı.";
    if (!currentData) return "Aranıyor.";
    if (
      currentData.products.length === 0 &&
      currentData.categories.length === 0
    ) {
      return "Sonuç bulunamadı.";
    }
    return `${currentData.productTotal} ürün ve ${currentData.categories.length} kategori bulundu.`;
  }, [currentData, normalizedQuery.length, open, status]);

  const value: SearchContextValue = {
    open,
    source,
    query,
    normalizedQuery,
    setQuery,
    openSearch,
    closeSearch,
    status,
    data,
    currentData,
    displayData,
    retry,
    activeKey,
    setActiveKey,
    moveActive,
    handleInputKeyDown,
    submitAll,
    options,
    optionId,
    listboxId,
    liveMessage,
  };

  return (
    <SearchContext.Provider value={value}>
      <div className="relative z-20 bg-paper">{children}</div>
      <SearchOverlay />
      <p aria-live="polite" className="sr-only" role="status">
        {liveMessage}
      </p>
    </SearchContext.Provider>
  );
}
