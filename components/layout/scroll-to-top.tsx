"use client";

import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SHOW_AFTER = 400;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          animate={{ opacity: 1, y: 0, scale: 1 }}
          aria-label="Yukarı çık"
          className="flex size-12 items-center justify-center rounded-full bg-brand-600 text-paper shadow-[0_14px_36px_-10px_rgba(23,81,62,0.6)] ring-1 ring-brass-300/60 transition-colors hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-500"
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          key="scroll-to-top"
          onClick={scrollToTop}
          title="Yukarı çık"
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          type="button"
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}