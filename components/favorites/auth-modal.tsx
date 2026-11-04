"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

type Mode = "login" | "signup";

export function AuthModal({
  open,
  nextPath,
  googleEnabled,
  turnstileSiteKey,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  nextPath: string;
  googleEnabled: boolean;
  turnstileSiteKey: string;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <AuthModalPanel
          googleEnabled={googleEnabled}
          key="auth-modal"
          nextPath={nextPath}
          onAuthenticated={onAuthenticated}
          onClose={onClose}
          turnstileSiteKey={turnstileSiteKey}
        />
      ) : null}
    </AnimatePresence>
  );
}

function AuthModalPanel({
  nextPath,
  googleEnabled,
  turnstileSiteKey,
  onClose,
  onAuthenticated,
}: {
  nextPath: string;
  googleEnabled: boolean;
  turnstileSiteKey: string;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-ink/45"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-sm border border-line-strong bg-paper p-6 shadow-[0_32px_70px_-40px_rgba(20,19,15,0.6)] sm:p-8"
        exit={{ opacity: 0, y: 12 }}
        initial={{ opacity: 0, y: 12 }}
        role="dialog"
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          aria-label="Kapat"
          className="absolute right-4 top-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
          onClick={onClose}
          type="button"
        >
          Kapat ×
        </button>

        <p className="eyebrow pr-16">Favoriler</p>
        <h2
          className="mt-3 pr-10 font-display text-2xl leading-tight font-semibold text-ink"
          id="auth-modal-title"
        >
          Favorilere eklemek için giriş yapın
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Favorileriniz hesabınıza bağlıdır. Giriş yapın veya hemen üye olun;
          seçtiğiniz ürün otomatik olarak favorilerinize eklenir.
        </p>

        <div
          aria-label="Giriş veya üye ol"
          className="mt-6 grid grid-cols-2 gap-1 rounded-sm border border-line bg-surface/60 p-1"
          role="tablist"
        >
          <button
            aria-selected={mode === "login"}
            className={`rounded-sm px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              mode === "login"
                ? "bg-paper font-semibold text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
            onClick={() => setMode("login")}
            role="tab"
            type="button"
          >
            Giriş Yap
          </button>
          <button
            aria-selected={mode === "signup"}
            className={`rounded-sm px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
              mode === "signup"
                ? "bg-paper font-semibold text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
            onClick={() => setMode("signup")}
            role="tab"
            type="button"
          >
            Üye Ol
          </button>
        </div>

        <div className="mt-6">
          {mode === "login" ? (
            <LoginForm
              embedded
              googleEnabled={googleEnabled}
              next={nextPath}
              onSuccess={onAuthenticated}
              onSwitchMode={() => setMode("signup")}
            />
          ) : (
            <SignupForm
              embedded
              googleEnabled={googleEnabled}
              next={nextPath}
              onSuccess={onAuthenticated}
              onSwitchMode={() => setMode("login")}
              turnstileSiteKey={turnstileSiteKey}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
