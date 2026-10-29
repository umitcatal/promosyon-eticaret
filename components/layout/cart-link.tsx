import Link from "next/link";
import { cartCount, getCart } from "@/lib/cart";

export async function CartLink() {
  const cart = await getCart();
  const count = cartCount(cart);

  return (
    <Link
      aria-label="Sepetim"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:border-orange-300 hover:text-orange-600"
      href="/sepet"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
