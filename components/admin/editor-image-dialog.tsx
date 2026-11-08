"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlus, Upload, Link2, X } from "lucide-react";
import { uploadEditorImageAction } from "@/app/actions/content";
import { inputClass } from "@/components/ui/styles";

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/avif";

const SAFE_URL = /^(https?:\/\/|\/(?!\/))[^\s]+$/i;

export function EditorImageDialog({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = tab === "url" ? urlRef.current : fileRef.current;
    target?.focus();
  }, [tab]);

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function insertImage(src: string) {
    editor
      .chain()
      .focus()
      .setImage({ src, alt: alt.trim() || undefined })
      .run();
    onClose();
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Lütfen bir görsel seçin.");
      return;
    }

    setBusy(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    const result = await uploadEditorImageAction(formData);
    setBusy(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    insertImage(result.url);
  }

  function handleUrl() {
    const value = url.trim();
    if (!SAFE_URL.test(value)) {
      setError("Geçerli bir adres girin: https://... veya /uploads/...");
      return;
    }
    insertImage(value);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="editor-image-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-sm font-semibold text-zinc-900"
              id="editor-image-title"
            >
              Görsel ekle
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Bilgisayarınızdan yükleyin veya bir adres girin.
            </p>
          </div>
          <button
            aria-label="Kapat"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === "upload"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => {
              setTab("upload");
              setError(null);
            }}
            type="button"
          >
            <Upload size={14} />
            Yükle
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === "url"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => {
              setTab("url");
              setError(null);
            }}
            type="button"
          >
            <Link2 size={14} />
            URL ile ekle
          </button>
        </div>

        {tab === "upload" ? (
          <input
            accept={ACCEPTED_TYPES}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            ref={fileRef}
            type="file"
          />
        ) : (
          <input
            className={inputClass}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://ornek.com/gorsel.jpg"
            ref={urlRef}
            type="url"
            value={url}
          />
        )}

        <div className="mt-3">
          <label
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500"
            htmlFor="editor-image-alt"
          >
            Alt metin
          </label>
          <input
            className={inputClass}
            id="editor-image-alt"
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Görselin kısa açıklaması"
            value={alt}
          />
        </div>

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            onClick={onClose}
            type="button"
          >
            Vazgeç
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={tab === "upload" ? handleUpload : handleUrl}
            type="button"
          >
            <ImagePlus size={15} />
            {busy ? "Yükleniyor..." : "Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
