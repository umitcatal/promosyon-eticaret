export const VAT_RATE_SETTING_KEY = "vat_rate";

export const VAT_RATES = [0, 1, 10, 20] as const;

export const DEFAULT_VAT_RATE: number = 20;

export function parseVatRate(raw: string | null): number {
  const value = String(raw ?? "")
    .trim()
    .replace(",", ".");
  if (value === "") return DEFAULT_VAT_RATE;
  const rate = Number(value);
  return VAT_RATES.includes(rate as (typeof VAT_RATES)[number])
    ? rate
    : DEFAULT_VAT_RATE;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type VatBreakdown = {
  net: number;
  vat: number;
  gross: number;
};

export function breakdownVat(netTotal: number, rate: number): VatBreakdown {
  const net = roundMoney(netTotal);
  const vat = roundMoney(net * (rate / 100));
  return { net, vat, gross: roundMoney(net + vat) };
}
