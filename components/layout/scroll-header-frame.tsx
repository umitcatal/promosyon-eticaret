"use client";

import { useEffect, useState } from "react";

// Collapsing the header shrinks the document by its collapsed height (~90px
// on mobile). If the trigger sits below that delta, scroll anchoring pulls the
// page back to the top and the header flickers between both states. Keeping
// the band wider than the delta makes each transition stick.
const CONDENSE_AFTER = 160;
const EXPAND_BEFORE = 8;

export function ScrollHeaderFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      setCondensed((current) =>
        current ? y > EXPAND_BEFORE : y > CONDENSE_AFTER
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
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
