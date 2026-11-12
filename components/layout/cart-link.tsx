import Link from "next/link";
import { cartCount, getCart } from "@/lib/cart";

export async function CartLink() {
  const cart = await getCart();
  const count = cartCount(cart);

  return (
    <Link
      aria-label="Sepetim"
      className="relative flex size-9 shrink-0 items-center justify-center rounded-sm border border-line text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-700"
      href="/sepet"
    >
      <svg
        aria-hidden="true"
        className="size-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-brand-600 px-1 font-mono text-[10px] font-semibold text-paper">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
