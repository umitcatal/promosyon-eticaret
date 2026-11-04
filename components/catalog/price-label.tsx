import { formatPrice } from "@/lib/format";

export function PriceLabel({
  min,
  max,
}: {
  min: number | null;
  max: number | null;
}) {
  const minLabel = formatPrice(min);
  const maxLabel = formatPrice(max);
  const priceLabel =
    minLabel && maxLabel && minLabel !== maxLabel
      ? `${minLabel} – ${maxLabel}`
      : minLabel;

  if (priceLabel) {
    return (
      <p className="font-display text-[15px] font-semibold tabular-nums text-ink">
        {priceLabel}
      </p>
    );
  }

  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-700 underline decoration-brass-300 decoration-1 underline-offset-4">
      Teklif İste
    </p>
  );
}
