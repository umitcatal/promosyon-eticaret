"use client";

import { useEffect, useState } from "react";

export function ScrollHeaderFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`site-header sticky top-0 z-40 bg-paper transition-shadow duration-300 ${
        condensed ? "shadow-[0_1px_0_0_var(--color-line-strong)]" : ""
      }`}
      data-condensed={condensed ? "true" : "false"}
    >
      {children}
    </div>
  );
}
