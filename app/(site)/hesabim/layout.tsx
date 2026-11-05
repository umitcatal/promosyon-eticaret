import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { countFavorites } from "@/lib/favorites";

export const instant = false;

export default async function AccountLayout({
  children,
}: LayoutProps<"/hesabim">) {
  const user = await getCurrentUser();
  if (!user) return <>{children}</>;

  const orderCount = (
    db
      .prepare("SELECT COUNT(*) AS total FROM orders WHERE user_id = ?")
      .get(user.id) as { total: number }
  ).total;

  const favoriteCount = countFavorites(user.id);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700">
              {user.firstName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <AccountNav
            favoriteCount={favoriteCount}
            isAdmin={user.role === "admin"}
            orderCount={orderCount}
          />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
