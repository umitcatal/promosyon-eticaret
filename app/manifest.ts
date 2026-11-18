import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getRequestSiteId } from "@/lib/site-request";
import { getSiteIdentity } from "@/lib/site-settings";
import { readSiteTheme } from "@/lib/site-theme";
import { themeColor } from "@/lib/theme";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await connection();

  const siteId = await getRequestSiteId();
  const identity = getSiteIdentity(siteId);
  const color = themeColor(readSiteTheme(siteId));

  return {
    name: identity.seoTitle,
    short_name: identity.siteName,
    description: identity.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: color,
    theme_color: color,
    icons: [
      {
        src: "/favicon/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
