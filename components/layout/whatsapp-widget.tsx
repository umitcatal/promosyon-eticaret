"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { CheckCheck, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buildWhatsAppChatUrl } from "@/lib/whatsapp";

type ChatMessage = {
  id: string;
  text: string;
  time: string;
};

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function WhatsAppWidget({
  logoUrl,
  number,
  title,
  welcomeMessage,
}: {
  logoUrl: string | null;
  number: string;
  title: string;
  welcomeMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [welcomeTime, setWelcomeTime] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, open, welcomeTime]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function toggleOpen() {
    if (!open) setWelcomeTime(formatTime(new Date()));
    setOpen((value) => !value);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const now = new Date();
    const id = `${now.getTime()}-${Math.random().toString(36).slice(2)}`;
    setMessages((current) => [
      ...current,
      { id, text, time: formatTime(now) },
    ]);
    setDraft("");

    window.open(
      buildWhatsAppChatUrl(number, text),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-label="WhatsApp destek sohbeti"
            className="flex h-[min(540px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[380px] origin-bottom-right flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-20px_rgba(20,19,15,0.45)] ring-1 ring-black/5"
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            key="whatsapp-panel"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
              <div className="relative size-10 shrink-0">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-white">
                  {logoUrl ? (
                    <Image
                      alt="Şirket logosu"
                      className="size-full object-contain p-1"
                      height={80}
                      src={logoUrl}
                      width={80}
                    />
                  ) : (
                    <span className="font-display text-sm font-semibold text-[#075e54]">
                      KP
                    </span>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-[#075e54] bg-[#25d366]"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/75">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-[#25d366]"
                  />
                  Çevrimiçi
                </p>
              </div>

              <button
                aria-label="Sohbeti kapat"
                className="flex size-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </header>

            <div
              className="whatsapp-chat-bg flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4"
              ref={listRef}
            >
              <div className="flex justify-center pb-1">
                <span className="rounded-md bg-[#e2ddd4]/90 px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#54656f] shadow-sm">
                  BUGÜN
                </span>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
                  <p className="whitespace-pre-wrap text-[13px] leading-5 text-[#111b21]">
                    {welcomeMessage}
                  </p>
                  <p className="mt-1 text-right text-[10px] leading-none text-[#667781]">
                    {welcomeTime}
                  </p>
                </div>
              </div>

              {messages.map((message) => (
                <div className="flex justify-end" key={message.id}>
                  <div className="max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-1.5 shadow-sm">
                    <p className="whitespace-pre-wrap text-[13px] leading-5 text-[#111b21]">
                      {message.text}
                    </p>
                    <p className="mt-1 flex items-center justify-end gap-1 text-[10px] leading-none text-[#667781]">
                      {message.time}
                      <CheckCheck
                        aria-hidden="true"
                        className="size-3 text-[#53bdeb]"
                      />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="border-t border-black/5 bg-[#f0f2f5] px-2.5 pt-2.5 pb-1.5"
              onSubmit={handleSubmit}
            >
              <div className="flex items-center gap-2">
                <input
                  aria-label="Mesajınız"
                  autoComplete="off"
                  className="h-10 min-w-0 flex-1 rounded-full bg-white px-4 text-[13px] text-[#111b21] shadow-sm outline-none placeholder:text-[#667781] focus:ring-2 focus:ring-[#25d366]/40"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Mesaj yazın"
                  ref={inputRef}
                  type="text"
                  value={draft}
                />
                <button
                  aria-label="WhatsApp üzerinden gönder"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#008069] text-white shadow-sm transition hover:bg-[#006e5b] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!draft.trim()}
                  type="submit"
                >
                  <Send aria-hidden="true" className="size-4" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] leading-4 text-[#667781]">
                Mesaj, WhatsApp üzerinden destek ekibimize iletilir.
              </p>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <button
        aria-expanded={open}
        aria-label={
          open ? "WhatsApp sohbetini kapat" : "WhatsApp destek hattını aç"
        }
        className="flex items-center gap-2.5 rounded-full bg-[#25d366] px-4 py-3 text-white shadow-[0_14px_36px_-10px_rgba(37,211,102,0.75)] transition hover:bg-[#1fbe5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128c7e]"
        onClick={toggleOpen}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-6" />
        ) : (
          <WhatsAppIcon className="size-6" />
        )}
        <span className="hidden text-sm font-semibold sm:block">
          {open ? "Kapat" : "WhatsApp Destek"}
        </span>
      </button>
    </div>
  );
}
