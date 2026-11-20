"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveRedirectAction } from "@/app/actions/redirects";
import type { AdminActionState } from "@/app/actions/admin";
import { inputClass, labelClass } from "@/components/ui/styles";
import {
  parseSource,
  sourceParamNames,
} from "@/lib/redirect-pattern";
import type { RedirectRule } from "@/lib/redirects";

const initialState: AdminActionState = {};

type Mode = "exact" | "pattern";

function modeOf(source: string): Mode {
  const parsed = parseSource(source).parsed;
  return parsed?.kind === "pattern" ? "pattern" : "exact";
}

export function RedirectForm({ rule }: { rule?: RedirectRule }) {
  const [state, action, pending] = useActionState(
    saveRedirectAction,
    initialState
  );

  const [source, setSource] = useState(rule?.source ?? "");
  const [destination, setDestination] = useState(rule?.destination ?? "");
  const [note, setNote] = useState(rule?.note ?? "");
  const [active, setActive] = useState(rule ? rule.active === 1 : true);
  const [mode, setMode] = useState<Mode>(modeOf(rule?.source ?? ""));

  const params = useMemo(() => {
    const parsed = parseSource(source).parsed;
    return parsed ? sourceParamNames(parsed) : [];
  }, [source]);

  return (
    <form action={action} className="space-y-5">
      {rule ? <input name="id" type="hidden" value={rule.id} /> : null}

      <div>
        <span className={labelClass}>Kural türü</span>
        <div className="inline-flex rounded-lg border border-zinc-300 bg-zinc-50 p-1">
          {(
            [
              { value: "exact", label: "Tek URL" },
              { value: "pattern", label: "Desen (pattern)" },
            ] as { value: Mode; label: string }[]
          ).map((option) => (
            <button
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                mode === option.value
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
              key={option.value}
              onClick={() => setMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {mode === "exact"
            ? "Tek bir eski adresi yeni bir adrese yönlendirmek için kullanın."
            : "Belirli bir kalıptaki tüm eski adresleri (örn. eski kategori detay sayfaları) topluca yönlendirmek için kullanın."}
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="source">
          Eski adres (kaynak)
        </label>
        <input
          autoComplete="off"
          className={`${inputClass} font-mono`}
          id="source"
          name="source"
          onChange={(event) => setSource(event.target.value)}
          placeholder={
            mode === "exact"
              ? "/kategoriDetay/12/kalem"
              : "/kategoriDetay/:id/:slug"
          }
          spellCheck={false}
          value={source}
        />
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          {mode === "exact"
            ? "Eski sitenin adresini / ile başlayacak şekilde tam olarak yazın."
            : "Değişkenler : ile başlar ve bir yol bölümünü temsil eder. :ad* joker olarak kalan tüm bölümleri yakalar (yalnızca sonda)."}
        </p>
        {mode === "pattern" && source.trim() !== "" && params.length === 0 ? (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Kaynakta değişken bulunmuyor; bu kural tek URL olarak
            kaydedilecek.
          </p>
        ) : null}
      </div>

      {params.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Kaynakta tanımlı değişkenler
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {params.map((param) => (
              <code
                className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200"
                key={param.name}
              >
                :{param.name}
                {param.wildcard ? "*" : ""}
              </code>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Hedef adreste de aynı değişkenleri kullanabilirsiniz. Eşleşen değer
            hedefe otomatik aktarılır.
          </p>
        </div>
      ) : null}

      <div>
        <label className={labelClass} htmlFor="destination">
          Yeni adres (hedef)
        </label>
        <input
          autoComplete="off"
          className={`${inputClass} font-mono`}
          id="destination"
          name="destination"
          onChange={(event) => setDestination(event.target.value)}
          placeholder={
            mode === "exact" ? "/kategori/kalem" : "/kategori/:slug"
          }
          spellCheck={false}
          value={destination}
        />
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Sitedeki yeni bir adres (/kategori/...) veya tam adres
          (https://...) girilebilir. Sorgu parametreleri korunur.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="statusCode">
            Yönlendirme türü
          </label>
          <select
            className={inputClass}
            defaultValue={String(rule?.status_code ?? 301)}
            id="statusCode"
            name="statusCode"
          >
            <option value="301">301 — Kalıcı (SEO için önerilir)</option>
            <option value="302">302 — Geçici</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="note">
            Açıklama (isteğe bağlı)
          </label>
          <input
            className={inputClass}
            id="note"
            maxLength={200}
            name="note"
            onChange={(event) => setNote(event.target.value)}
            placeholder="Örn: Eski PHP kategori adresi"
            value={note}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input
          checked={active}
          className="h-4 w-4 rounded border-zinc-300 text-orange-600"
          name="active"
          onChange={(event) => setActive(event.target.checked)}
          type="checkbox"
        />
        Kural aktif olsun
      </label>

      {mode === "pattern" ? (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs leading-5 text-zinc-500">
          Örnek: <code className="font-semibold">/kategoriDetay/:id/:slug</code>{" "}
          → <code className="font-semibold">/kategori/:slug</code>. Ziyaretçi{" "}
          <code>/kategoriDetay/12/kalem</code> adresine geldiğinde{" "}
          <code>/kategori/kalem</code> adresine yönlendirilir. Desenler, sitede
          var olan gerçek adresleri gölgeleyebilir; emin değilseniz kuralı pasif
          bırakıp test edin.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Kaydediliyor..."
            : rule
              ? "Değişiklikleri Kaydet"
              : "Yönlendirme Ekle"}
        </button>
        <Link
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          href="/admin/yonlendirmeler"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
