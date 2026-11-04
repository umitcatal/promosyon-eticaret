"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getFavoritesStateAction,
  setFavoriteAction,
} from "@/app/actions/favorites";
import { AuthModal } from "./auth-modal";

const PENDING_KEY = "promosyon_pending_favorite";
const PENDING_MAX_AGE = 10 * 60 * 1000;

export type FavoritesContextValue = {
  ready: boolean;
  authenticated: boolean;
  count: number;
  isFavorite: (productId: number) => boolean;
  isPending: (productId: number) => boolean;
  toggle: (productId: number) => Promise<void>;
  openAuthModal: (productId: number) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function writePending(productId: number) {
  try {
    window.sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ id: productId, ts: Date.now() })
    );
  } catch {
    // sessionStorage kullanılamıyorsa otomatik ekleme atlanır
  }
}

function takePending(): number | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_KEY);
    const parsed = JSON.parse(raw) as { id?: unknown; ts?: unknown };
    if (
      typeof parsed.id !== "number" ||
      !Number.isInteger(parsed.id) ||
      parsed.id <= 0 ||
      typeof parsed.ts !== "number" ||
      Date.now() - parsed.ts > PENDING_MAX_AGE
    ) {
      return null;
    }
    return parsed.id;
  } catch {
    window.sessionStorage.removeItem(PENDING_KEY);
    return null;
  }
}

function clearPending() {
  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // yok sayılır
  }
}

export function FavoritesProvider({
  children,
  googleEnabled,
  turnstileSiteKey,
}: {
  children: ReactNode;
  googleEnabled: boolean;
  turnstileSiteKey: string;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [ids, setIds] = useState<Set<number>>(() => new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNext, setModalNext] = useState("/");

  const applyPendingFavorite = useCallback(async (productId: number) => {
    const result = await setFavoriteAction(productId, true);
    if (result.requiresAuth) {
      setAuthenticated(false);
      setIds(new Set());
      return;
    }
    if (result.favorite) {
      setIds((current) => {
        if (current.has(productId)) return current;
        const next = new Set(current);
        next.add(productId);
        return next;
      });
    }
  }, []);

  const sync = useCallback(async () => {
    const state = await getFavoritesStateAction();
    setReady(true);
    setAuthenticated(state.authenticated);
    setIds(new Set(state.ids));
    if (state.authenticated) {
      const pending = takePending();
      if (pending !== null) void applyPendingFavorite(pending);
    }
  }, [applyPendingFavorite]);

  useEffect(() => {
    // Sunucu oturumundaki favori durumunu istemciye aktarır; setState await sonrasında çalışır.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sync();
  }, [sync]);

  const handlePathChange = useCallback(() => {
    setModalOpen(false);
    void sync();
  }, [sync]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") void sync();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [sync]);

  const closeModal = useCallback((discardPending: boolean) => {
    if (discardPending) clearPending();
    setModalOpen(false);
  }, []);

  const handleClose = useCallback(() => closeModal(true), [closeModal]);

  const openAuthModal = useCallback((productId: number) => {
    writePending(productId);
    setModalNext(`${window.location.pathname}${window.location.search}`);
    setModalOpen(true);
  }, []);

  const toggle = useCallback(
    async (productId: number) => {
      if (!ready) return;

      if (!authenticated) {
        openAuthModal(productId);
        return;
      }

      const wasFavorite = ids.has(productId);
      const nextFavorite = !wasFavorite;

      setIds((current) => {
        const next = new Set(current);
        if (nextFavorite) next.add(productId);
        else next.delete(productId);
        return next;
      });
      setPendingIds((current) => new Set(current).add(productId));

      try {
        const result = await setFavoriteAction(productId, nextFavorite);
        if (result.requiresAuth) {
          setAuthenticated(false);
          setIds(new Set());
          openAuthModal(productId);
          return;
        }
        if (result.error) {
          setIds((current) => {
            const next = new Set(current);
            if (wasFavorite) next.add(productId);
            else next.delete(productId);
            return next;
          });
        }
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    },
    [authenticated, ids, openAuthModal, ready]
  );

  const handleAuthenticated = useCallback(() => {
    setModalOpen(false);
    router.refresh();
    void sync();
  }, [router, sync]);

  const isFavorite = useCallback(
    (productId: number) => ids.has(productId),
    [ids]
  );
  const isPending = useCallback(
    (productId: number) => pendingIds.has(productId),
    [pendingIds]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ready,
      authenticated,
      count: ready ? ids.size : 0,
      isFavorite,
      isPending,
      toggle,
      openAuthModal,
    }),
    [authenticated, ids.size, isFavorite, isPending, openAuthModal, ready, toggle]
  );

  return (
    <FavoritesContext.Provider value={value}>
      <Suspense fallback={null}>
        <PathnameWatcher onChange={handlePathChange} />
      </Suspense>
      {children}
      <AuthModal
        googleEnabled={googleEnabled}
        nextPath={modalNext}
        onAuthenticated={handleAuthenticated}
        onClose={handleClose}
        open={modalOpen}
        turnstileSiteKey={turnstileSiteKey}
      />
    </FavoritesContext.Provider>
  );
}

function PathnameWatcher({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    onChange();
  }, [onChange, pathname]);

  return null;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites, FavoritesProvider içinde kullanılmalıdır.");
  }
  return context;
}
