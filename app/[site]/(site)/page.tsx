import type { Metadata } from "next";
import { HomeWidgetSection } from "@/components/catalog/home-widget";
import { getHomeWidgets } from "@/lib/queries";
import { openGraphBase } from "@/lib/seo";
import { getCurrentSiteId } from "@/lib/site-context";
import { getSiteIdentity } from "@/lib/site-settings";
import { getSiteBaseUrl } from "@/lib/sites";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = await getCurrentSiteId();
  const identity = getSiteIdentity(siteId);
  const baseUrl = getSiteBaseUrl(siteId);

  return {
    title: { absolute: identity.seoTitle },
    description: identity.seoDescription,
    alternates: { canonical: "/" },
    openGraph: {
      ...openGraphBase(baseUrl, identity),
      url: "/",
      title: identity.siteName,
      description: identity.seoDescription,
    },
  };
}

export default async function HomePage() {
  const widgets = await getHomeWidgets();

  return (
    <div className="flex-1">
      {widgets.map((widget) => (
        <HomeWidgetSection key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
