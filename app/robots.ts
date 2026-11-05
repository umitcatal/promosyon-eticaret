import type { MetadataRoute } from "next";
import { SITE_BASE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_BASE}/sitemap.xml`,
  };
}
