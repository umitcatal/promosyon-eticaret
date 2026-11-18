import Link from "next/link";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { SiteSwitcher } from "@/components/admin/site-switcher";
import { requireAdmin } from "@/lib/auth";
import { getAdminSiteId } from "@/lib/site-request";
import { listSites } from "@/lib/site-settings";
import { getSiteBaseUrl } from "@/lib/sites";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/[site]/admin">) {
  const user = await requireAdmin();
  const siteId = await getAdminSiteId();
  const sites = listSites();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="px-3 text-xs font-bold uppercase tracking-wide text-zinc-400">
            Yönetim
          </p>
          <AdminNav />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Yönetim Paneli
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {user.firstName} {user.lastName} olarak giriş yapıldı
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SiteSwitcher activeSiteId={siteId} sites={sites} />
            <Link
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href={getSiteBaseUrl(siteId)}
            >
              Siteye Dön
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
