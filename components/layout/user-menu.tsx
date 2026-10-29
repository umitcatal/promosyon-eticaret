import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:text-orange-600"
          href="/giris"
        >
          Giriş Yap
        </Link>
        <Link
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          href="/kayit"
        >
          Üye Ol
        </Link>
      </div>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-300 hover:text-orange-600">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
          {user.firstName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:block">
          {user.firstName}
        </span>
        <svg
          className="h-3 w-3 text-zinc-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
        <div className="border-b border-zinc-100 px-3 py-2">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
        <Link
          className="mt-1 block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-orange-50 hover:text-orange-700"
          href="/hesabim"
        >
          Hesabım
        </Link>
        <Link
          className="block rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-orange-50 hover:text-orange-700"
          href="/hesabim/siparisler"
        >
          Siparişlerim
        </Link>
        {user.role === "admin" ? (
          <Link
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            href="/admin"
          >
            Yönetim Paneli
          </Link>
        ) : null}
        <form action={logoutAction}>
          <button
            className="mt-1 w-full rounded-lg border-t border-zinc-100 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            type="submit"
          >
            Çıkış Yap
          </button>
        </form>
      </div>
    </details>
  );
}
