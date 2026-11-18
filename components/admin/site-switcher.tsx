"use client";

import { switchAdminSiteAction } from "@/app/actions/site";
import type { SiteRow } from "@/lib/site-settings";

export function SiteSwitcher({
  sites,
  activeSiteId,
}: {
  sites: SiteRow[];
  activeSiteId: number;
}) {
  return (
    <form action={switchAdminSiteAction}>
      <label className="sr-only" htmlFor="admin-site">
        Site seçimi
      </label>
      <select
        className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 outline-none transition hover:border-orange-300 focus:border-orange-400"
        defaultValue={activeSiteId}
        id="admin-site"
        name="siteId"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
    </form>
  );
}
