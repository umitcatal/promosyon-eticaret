import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Dropdown } from "./dropdown";

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          className="border-b border-transparent pb-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          href="/giris"
        >
          Giriş
        </Link>
        <Link
          className="rounded-sm bg-brand-600 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-brand-700"
          href="/kayit"
        >
          Teklif Al
        </Link>
      </div>
    );
  }

  return (
    <Dropdown className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-sm border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:border-line-strong hover:text-ink">
        <span className="flex size-6 items-center justify-center rounded-sm bg-brand-600 font-display text-xs font-semibold text-paper">
          {user.firstName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:block">
          {user.firstName}
        </span>
        <svg
          aria-hidden="true"
          className="size-3 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-sm border border-line-strong bg-paper p-1.5 shadow-[0_24px_50px_-32px_rgba(20,19,15,0.5)]">
        <div className="border-b border-line px-3 py-2.5">
          <p className="truncate font-display text-sm font-semibold text-ink">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate font-mono text-[10px] tracking-wide text-ink-muted">
            {user.email}
          </p>
        </div>
        <Link
          className="mt-1 block rounded-sm px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-brand-700"
          href="/hesabim"
        >
          Hesabım
        </Link>
        <Link
          className="block rounded-sm px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-brand-700"
          href="/hesabim/siparisler"
        >
          Siparişlerim
        </Link>
        {user.role === "admin" ? (
          <Link
            className="block rounded-sm px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-surface"
            href="/admin"
          >
            Yönetim Paneli
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button
            className="mt-1 w-full rounded-sm border-t border-line px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            type="submit"
          >
            Çıkış Yap
          </button>
        </form>
      </div>
    </Dropdown>
  );
}
