export const ORDER_STATUSES = [
  { value: "yeni", label: "Yeni", color: "bg-orange-100 text-orange-800" },
  {
    value: "iletisimde",
    label: "İletişime Geçildi",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "tamamlandi",
    label: "Tamamlandı",
    color: "bg-green-100 text-green-800",
  },
  { value: "iptal", label: "İptal", color: "bg-red-100 text-red-800" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export function statusLabel(status: string): string {
  return (
    ORDER_STATUSES.find((option) => option.value === status)?.label ?? status
  );
}

export function statusColor(status: string): string {
  return (
    ORDER_STATUSES.find((option) => option.value === status)?.color ??
    "bg-zinc-100 text-zinc-700"
  );
}

export type OrderRow = {
  id: number;
  user_id: number;
  status: string;
  note: string | null;
  total: number | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: number;
  order_id: number;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  product_code: string | null;
  unit_price: number | null;
  quantity: number;
};
