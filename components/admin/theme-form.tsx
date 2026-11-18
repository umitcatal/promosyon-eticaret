"use client";

import { useActionState, useMemo, useState } from "react";
import {
  saveThemeAction,
  type ThemeActionState,
} from "@/app/actions/site";
import { inputClass, labelClass } from "@/components/ui/styles";
import {
  buildCustomPalette,
  DEFAULT_THEME,
  normalizeHex,
  paletteCssVariables,
  THEME_PRESETS,
  type ThemePresetId,
  type ThemeSelection,
} from "@/lib/theme";

const initialState: ThemeActionState = {};

const BRAND_SHADES = [
  "bg-brand-50",
  "bg-brand-100",
  "bg-brand-200",
  "bg-brand-300",
  "bg-brand-400",
  "bg-brand-500",
  "bg-brand-600",
  "bg-brand-700",
  "bg-brand-800",
  "bg-brand-900",
] as const;

const BRASS_SHADES = [
  "bg-brass-50",
  "bg-brass-100",
  "bg-brass-200",
  "bg-brass-300",
  "bg-brass-400",
  "bg-brass-500",
  "bg-brass-600",
  "bg-brass-700",
  "bg-brass-800",
  "bg-brass-900",
] as const;

type ColorFieldProps = {
  id: string;
  label: string;
  value: string;
  fallback: string;
  hint: string;
  onChange: (value: string) => void;
};

function ColorField({
  id,
  label,
  value,
  fallback,
  hint,
  onChange,
}: ColorFieldProps) {
  const normalized = normalizeHex(value);

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          aria-label={`${label} renk seçici`}
          className="h-10 w-12 cursor-pointer rounded-sm border border-line-strong bg-paper p-1"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={normalized ?? fallback}
        />
        <input
          autoComplete="off"
          className={inputClass}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#17513e"
          spellCheck={false}
          value={value}
        />
      </div>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{hint}</p>
      {normalized === null ? (
        <p className="mt-1 text-xs font-medium text-red-600">
          Geçerli bir HEX değeri girin (örn. #17513e).
        </p>
      ) : null}
    </div>
  );
}

export function ThemeForm({ theme }: { theme: ThemeSelection }) {
  const [state, action, pending] = useActionState(
    saveThemeAction,
    initialState
  );
  const [preset, setPreset] = useState<ThemePresetId>(theme.preset);
  const [primary, setPrimary] = useState(theme.primary);
  const [accent, setAccent] = useState(theme.accent);

  const custom = preset === "custom";

  const customPalette = useMemo(
    () => (custom ? buildCustomPalette(primary, accent) : null),
    [accent, custom, primary]
  );

  function choosePreset(id: ThemePresetId) {
    setPreset(id);
    if (id !== "custom") {
      setPrimary(THEME_PRESETS[id].primary);
      setAccent(THEME_PRESETS[id].accent);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <input name="themePreset" type="hidden" value={preset} />
      <input name="themePrimary" type="hidden" value={primary} />
      <input name="themeAccent" type="hidden" value={accent} />

      <fieldset>
        <legend className={labelClass}>Hazır temalar</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {Object.values(THEME_PRESETS).map((option) => {
            const active = preset === option.id;
            return (
              <button
                aria-pressed={active}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-orange-500 bg-orange-50/60 ring-1 ring-orange-500/30"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
                key={option.id}
                onClick={() => choosePreset(option.id)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ background: option.primary }}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-black/10"
                    style={{ background: option.accent }}
                  />
                </span>
                <span className="mt-2 block text-sm font-semibold text-zinc-900">
                  {option.name}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                  {option.description}
                </span>
              </button>
            );
          })}

          <button
            aria-pressed={custom}
            className={`rounded-xl border p-3 text-left transition ${
              custom
                ? "border-orange-500 bg-orange-50/60 ring-1 ring-orange-500/30"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
            onClick={() => choosePreset("custom")}
            type="button"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-5 w-5 rounded-full border border-black/10"
                style={{
                  background: normalizeHex(primary) ?? DEFAULT_THEME.primary,
                }}
              />
              <span
                className="h-5 w-5 rounded-full border border-black/10"
                style={{
                  background: normalizeHex(accent) ?? DEFAULT_THEME.accent,
                }}
              />
            </span>
            <span className="mt-2 block text-sm font-semibold text-zinc-900">
              Özel
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
              Kendi ana ve vurgu renginizi seçin
            </span>
          </button>
        </div>
      </fieldset>

      {custom ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            fallback={DEFAULT_THEME.primary}
            hint="Butonlar, bağlantılar ve menüde kullanılan ana marka rengi."
            id="themePrimary"
            label="Ana renk"
            onChange={setPrimary}
            value={primary}
          />
          <ColorField
            fallback={DEFAULT_THEME.accent}
            hint="Fiyat, etiket ve küçük vurgu metinlerinde kullanılır."
            id="themeAccent"
            label="Vurgu rengi"
            onChange={setAccent}
            value={accent}
          />
        </div>
      ) : (
        <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-600">
          Hazır tema seçildiğinde ana ve vurgu renkleri otomatik olarak
          uygulanır. Kendi renkleriniz için &quot;Özel&quot; seçeneğini
          kullanın.
        </p>
      )}

      <div>
        <p className={labelClass}>Canlı önizleme</p>
        <div
          className="mt-2 overflow-hidden rounded-xl border border-line bg-paper p-5"
          data-theme={custom ? "custom" : preset}
          style={
            customPalette ? paletteCssVariables(customPalette) : undefined
          }
        >
          <p className="eyebrow">Kurumsal Promosyon</p>
          <p className="mt-1 font-display text-lg font-semibold text-ink">
            Markanıza özel ürünler
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
              Teklif Al
            </span>
            <span className="rounded-sm border border-brand-600 px-3 py-2 text-sm font-semibold text-brand-700">
              Ürünleri İncele
            </span>
            <span className="text-sm font-semibold text-brand-600 underline underline-offset-2">
              Bağlantı örneği
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Fiyat
            </span>
            <span className="text-sm font-bold text-brass-700">
              ₺1.250,00
            </span>
          </div>
          <div className="mt-3 flex overflow-hidden rounded-sm">
            {BRAND_SHADES.map((shade, index) => (
              <span
                aria-hidden
                className={`h-5 flex-1 ${shade}`}
                key={`brand-${index}`}
              />
            ))}
          </div>
          <div className="mt-1 flex overflow-hidden rounded-sm">
            {BRASS_SHADES.map((shade, index) => (
              <span
                aria-hidden
                className={`h-5 flex-1 ${shade}`}
                key={`brass-${index}`}
              />
            ))}
          </div>
        </div>
      </div>

      {state.message ? (
        <p className="text-sm font-medium text-green-700">{state.message}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      ) : null}

      <button
        className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Kaydediliyor..." : "Temayı Kaydet"}
      </button>
    </form>
  );
}
