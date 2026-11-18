import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getRequestSiteId } from "@/lib/site-request";
import { getSiteBaseUrl } from "@/lib/sites";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();

  const siteId = await getRequestSiteId();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /sepet ve /hesabim footer'dan linkli: disallow, noindex'in okunmasını
        // engeller ve "yalnızca URL" olarak indekslenmelerine yol açar.
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${getSiteBaseUrl(siteId)}/sitemap.xml`,
  };
}
