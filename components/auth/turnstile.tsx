"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      "response-field": boolean;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function Turnstile({
  siteKey,
  resetKey,
  onTokenChange,
  onError,
}: {
  siteKey: string;
  resetKey: object;
  onTokenChange: (token: string) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const initialResetKeyRef = useRef(resetKey);
  const [token, setToken] = useState("");

  const clearToken = useCallback(() => {
    setToken("");
    onTokenChange("");
  }, [onTokenChange]);

  const handleError = useCallback(() => {
    clearToken();
    onError("Güvenlik doğrulaması yüklenemedi. Lütfen tekrar deneyin.");
  }, [clearToken, onError]);

  const renderWidget = useCallback(() => {
    if (
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current !== null ||
      !siteKey
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: "signup",
      "response-field": false,
      callback: (nextToken) => {
        setToken(nextToken);
        onTokenChange(nextToken);
        onError("");
      },
      "expired-callback": clearToken,
      "error-callback": handleError,
    });
  }, [clearToken, handleError, onError, onTokenChange, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  useEffect(() => {
    if (initialResetKeyRef.current === resetKey) return;
    clearToken();
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [clearToken, resetKey]);

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
        onError={handleError}
      />
      <div ref={containerRef} />
      <input name="cf-turnstile-response" type="hidden" value={token} />
    </div>
  );
}
