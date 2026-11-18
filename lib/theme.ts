import type { CSSProperties } from "react";

export const THEME_PRESET_IDS = ["1", "2"] as const;

export type BuiltInThemePresetId = (typeof THEME_PRESET_IDS)[number];
export type ThemePresetId = BuiltInThemePresetId | "custom";

export type ThemeSelection = {
  preset: ThemePresetId;
  primary: string;
  accent: string;
};

export type ThemePreset = {
  id: BuiltInThemePresetId;
  name: string;
  description: string;
  primary: string;
  accent: string;
};

export const DEFAULT_THEME: ThemeSelection = {
  preset: "1",
  primary: "#17513e",
  accent: "#b08123",
};

/*
 * Base colors mirror the palette anchors in globals.css: the primary color is
 * brand-600 (buttons, links) and the accent is brass-500 (eyebrows, prices).
 */
export const THEME_PRESETS: Record<BuiltInThemePresetId, ThemePreset> = {
  "1": {
    id: "1",
    name: "Zümrüt",
    description: "Koyu yeşil ana renk, pirinç sarısı vurgu",
    primary: "#17513e",
    accent: "#b08123",
  },
  "2": {
    id: "2",
    name: "Safir",
    description: "Lacivert ana renk, terracotta vurgu",
    primary: "#2c4e70",
    accent: "#b96538",
  },
};

export type ThemePalette = {
  brand: Record<number, string>;
  brass: Record<number, string>;
  orange: Record<number, string>;
};

type RampStep = {
  shade: number;
  toward: "white" | "black";
  amount: number;
};

const BRAND_RAMP: RampStep[] = [
  { shade: 50, toward: "white", amount: 0.92 },
  { shade: 100, toward: "white", amount: 0.82 },
  { shade: 200, toward: "white", amount: 0.66 },
  { shade: 300, toward: "white", amount: 0.48 },
  { shade: 400, toward: "white", amount: 0.27 },
  { shade: 500, toward: "white", amount: 0.13 },
  { shade: 600, toward: "white", amount: 0 },
  { shade: 700, toward: "black", amount: 0.16 },
  { shade: 800, toward: "black", amount: 0.31 },
  { shade: 900, toward: "black", amount: 0.46 },
];

const BRASS_RAMP: RampStep[] = [
  { shade: 50, toward: "white", amount: 0.9 },
  { shade: 100, toward: "white", amount: 0.76 },
  { shade: 200, toward: "white", amount: 0.55 },
  { shade: 300, toward: "white", amount: 0.34 },
  { shade: 400, toward: "white", amount: 0.16 },
  { shade: 500, toward: "white", amount: 0 },
  { shade: 600, toward: "black", amount: 0.15 },
  { shade: 700, toward: "black", amount: 0.3 },
  { shade: 800, toward: "black", amount: 0.44 },
  { shade: 900, toward: "black", amount: 0.55 },
];

export function isThemePresetId(value: unknown): value is ThemePresetId {
  return value === "1" || value === "2" || value === "custom";
}

export function isBuiltInThemePresetId(
  value: unknown
): value is BuiltInThemePresetId {
  return value === "1" || value === "2";
}

export function normalizeHex(value: unknown): string | null {
  const raw = String(value ?? "")
    .trim()
    .replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw
      .split("")
      .map((char) => char + char)
      .join("")
      .toLowerCase()}`;
  }

  if (/^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }

  return null;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex) ?? "#000000";
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  const channel =
    clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(channel * 255);
}

type Oklab = [number, number, number];

function rgbToOklab([red, green, blue]: [number, number, number]): Oklab {
  const r = srgbToLinear(red);
  const g = srgbToLinear(green);
  const b = srgbToLinear(blue);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([lightness, a, b]: Oklab): [number, number, number] {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function mixOklab(
  base: Oklab,
  target: Oklab,
  amount: number
): Oklab {
  return [
    base[0] + (target[0] - base[0]) * amount,
    base[1] + (target[1] - base[1]) * amount,
    base[2] + (target[2] - base[2]) * amount,
  ];
}

function toHex([red, green, blue]: [number, number, number]): string {
  const channel = (value: number) =>
    value.toString(16).padStart(2, "0").toUpperCase();
  return `#${channel(red)}${channel(green)}${channel(blue)}`.toLowerCase();
}

function buildRamp(baseHex: string, steps: RampStep[]): Record<number, string> {
  const base = rgbToOklab(hexToRgb(baseHex));
  const ramp: Record<number, string> = {};

  for (const step of steps) {
    const target: Oklab = step.toward === "white" ? [1, 0, 0] : [0, 0, 0];
    ramp[step.shade] = toHex(oklabToRgb(mixOklab(base, target, step.amount)));
  }

  return ramp;
}

export function buildCustomPalette(
  primary: string,
  accent: string
): ThemePalette {
  const brand = buildRamp(normalizeHex(primary) ?? DEFAULT_THEME.primary, BRAND_RAMP);
  const brass = buildRamp(normalizeHex(accent) ?? DEFAULT_THEME.accent, BRASS_RAMP);
  const orange: Record<number, string> = {
    ...brand,
    950: buildRamp(normalizeHex(primary) ?? DEFAULT_THEME.primary, [
      { shade: 950, toward: "black", amount: 0.58 },
    ])[950],
  };

  return { brand, brass, orange };
}

export function paletteCssVariables(palette: ThemePalette): CSSProperties {
  const variables: Record<string, string> = {};

  for (const [shade, value] of Object.entries(palette.brand)) {
    variables[`--color-brand-${shade}`] = value;
  }
  for (const [shade, value] of Object.entries(palette.brass)) {
    variables[`--color-brass-${shade}`] = value;
  }
  for (const [shade, value] of Object.entries(palette.orange)) {
    variables[`--color-orange-${shade}`] = value;
  }

  return variables as CSSProperties;
}

/*
 * Built-in presets keep their hand-tuned palettes in globals.css; only custom
 * selections ship inline variables, so preset colors never drift between the
 * stylesheet and the admin preview.
 */
export function themeCssVariables(
  theme: ThemeSelection
): CSSProperties | undefined {
  if (theme.preset !== "custom") return undefined;
  return paletteCssVariables(
    buildCustomPalette(theme.primary, theme.accent)
  );
}

export function themeColor(theme: ThemeSelection): string {
  if (theme.preset === "2") return "#1d2836";
  if (theme.preset === "1") return "#faf8f3";

  return buildCustomPalette(theme.primary, theme.accent).brand[800];
}
