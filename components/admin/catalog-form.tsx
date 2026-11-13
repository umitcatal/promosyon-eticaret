"use client";

import { useRef, useState, type FormEvent } from "react";
import { BookOpen, ExternalLink, Upload } from "lucide-react";
import { saveCatalogSettingsAction, type AdminActionState } from "@/app/actions/admin";
import { CATALOG_CHUNK_BYTES, MAX_CATALOG_BYTES, isCatalogExternalUrl, type CatalogSettings } from "@/lib/catalog";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";

async function uploadRequest(url: string, options: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, "x-catalog-upload": "1" },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new Error(data?.error ?? "Yükleme başarısız. Bağlantınızı kontrol edip tekrar deneyin.");
  }
  return data;
}

export function CatalogForm({ settings }: { settings: CatalogSettings }) {
  const [values, setValues] = useState(settings);
  const [state, setState] = useState<AdminActionState>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const file = values.source === "file" ? fileInput.current?.files?.[0] : undefined;
    if (!values.label.trim()) {
      setState({ error: "Katalog bağlantısında görünecek metni girin." });
      return;
    }
    if (values.source === "url" && ((values.url && !isCatalogExternalUrl(values.url.trim())) || (values.enabled && !values.url.trim()))) {
      setState({ error: "http:// veya https:// ile başlayan geçerli bir katalog adresi girin." });
      return;
    }
    if (values.enabled && values.source === "file" && !file && !values.fileUrl) {
      setState({ error: "Lütfen bir PDF katalog seçin." });
      return;
    }
    if (file && (!file.name.toLowerCase().endsWith(".pdf") || file.size < 5 || file.size > MAX_CATALOG_BYTES)) {
      setState({ error: "PDF dosyası boş olamaz ve 150 MB'ı aşamaz." });
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setState({});
    let uploadId: string | undefined;
    try {
      if (file) {
        setProgress(0);
        const upload = await uploadRequest("/api/admin/catalog", {
          method: "POST", signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size }),
        });
        uploadId = upload.uploadId;
        for (let offset = 0; offset < file.size; offset += CATALOG_CHUNK_BYTES) {
          const end = Math.min(offset + CATALOG_CHUNK_BYTES, file.size);
          await uploadRequest(`/api/admin/catalog?id=${uploadId}&offset=${offset}`, {
            method: "PUT", signal: abort.signal,
            headers: { "Content-Type": "application/octet-stream" },
            body: file.slice(offset, end),
          });
          setProgress(Math.round(end / file.size * 100));
        }
      }
      abort.signal.throwIfAborted();
      setProgress(null);
      const data = new FormData();
      data.set("label", values.label);
      data.set("source", values.source);
      data.set("url", values.url);
      if (values.enabled) data.set("enabled", "on");
      if (values.openInNewTab) data.set("openInNewTab", "on");
      if (uploadId) data.set("uploadId", uploadId);
      const result = await saveCatalogSettingsAction(data);
      setState(result);
      if (result.ok && result.settings) {
        uploadId = undefined;
        setValues(result.settings);
        if (fileInput.current) fileInput.current.value = "";
      }
    } catch (error) {
      setState({ error: abort.signal.aborted ? "Yükleme iptal edildi. Mevcut katalog değiştirilmedi." : error instanceof Error ? error.message : "Katalog kaydedilemedi." });
    } finally {
      if (uploadId) {
        await uploadRequest(`/api/admin/catalog?id=${uploadId}`, { method: "DELETE" }).catch(() => undefined);
      }
      controller.current = null;
      setProgress(null);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4" aria-busy={busy}>
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input type="checkbox" className="size-4 accent-brand-600" checked={values.enabled} onChange={(event) => setValues({ ...values, enabled: event.target.checked })} />
          Katalog bağlantısını üst barda göster
        </label>
        <div>
          <label className={labelClass} htmlFor="catalog-label">Bağlantı metni</label>
          <input id="catalog-label" className={inputClass} required maxLength={80} value={values.label} onChange={(event) => setValues({ ...values, label: event.target.value })} placeholder="Katalog" />
        </div>
        <fieldset>
          <legend className={labelClass}>Katalog kaynağı</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([{ value: "url", label: "Harici bağlantı", Icon: ExternalLink }, { value: "file", label: "PDF yükle", Icon: Upload }] as const).map(({ value, label, Icon }) => (
              <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${values.source === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                <input type="radio" name="catalog-source" value={value} checked={values.source === value} onChange={() => setValues({ ...values, source: value })} className="size-4 accent-brand-600" />
                <Icon aria-hidden="true" className="size-4" />{label}
              </label>
            ))}
          </div>
        </fieldset>
        {values.source === "url" ? (
          <div>
            <label className={labelClass} htmlFor="catalog-url">Katalog URL adresi</label>
            <input id="catalog-url" className={inputClass} type="url" maxLength={2048} required={values.enabled} value={values.url} onChange={(event) => setValues({ ...values, url: event.target.value })} placeholder="https://…" aria-describedby="catalog-url-help" />
            <p id="catalog-url-help" className="mt-1 text-xs text-zinc-500">Başka bir sitedeki PDF veya dijital katalog sayfasının adresini girebilirsiniz.</p>
          </div>
        ) : (
          <div>
            <label className={labelClass} htmlFor="catalog-file">PDF dosyası</label>
            <input ref={fileInput} id="catalog-file" className={inputClass} type="file" accept="application/pdf,.pdf" aria-describedby="catalog-file-help" />
            <p id="catalog-file-help" className="mt-1 text-xs leading-5 text-zinc-500">En fazla 150 MB. Büyük dosyalar küçük parçalar hâlinde yüklenir. Yeni dosya seçmezseniz mevcut PDF korunur.</p>
            {values.fileUrl ? (
              <a href={values.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 text-sm font-medium text-brand-700 underline underline-offset-4">
                <BookOpen aria-hidden="true" className="size-4 shrink-0" /><span className="break-all">{values.fileName || "Mevcut kataloğu aç"}</span><span className="sr-only"> (yeni sekmede açılır)</span>
              </a>
            ) : null}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" className="size-4 accent-brand-600" checked={values.openInNewTab} onChange={(event) => setValues({ ...values, openInNewTab: event.target.checked })} />
          Yeni sekmede aç
        </label>
      </fieldset>
      {progress !== null ? (
        <div className="space-y-2" role="status">
          <div className="flex justify-between text-sm text-zinc-600"><span>PDF yükleniyor, bu sayfayı kapatmayın.</span><span>%{progress}</span></div>
          <progress className="h-2 w-full accent-brand-600" max={100} value={progress} aria-label="Katalog yükleme ilerlemesi" />
          <button className={secondaryButtonClass} type="button" onClick={() => controller.current?.abort()}>Yüklemeyi iptal et</button>
        </div>
      ) : null}
      {state.error ? <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-sm font-medium text-emerald-600">{state.message}</p> : null}
      <button className={primaryButtonClass} disabled={busy} type="submit">{busy ? progress !== null ? "PDF yükleniyor…" : "Kaydediliyor…" : "Katalog Ayarlarını Kaydet"}</button>
    </form>
  );
}
