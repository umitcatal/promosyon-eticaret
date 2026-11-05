import type { Metadata } from "next";
import { HomeWidgetSection } from "@/components/catalog/home-widget";
import { getHomeWidgets } from "@/lib/queries";
import { openGraphBase } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "Promosyon Eticaret | Kurumsal Promosyon Ürünleri",
  },
  description:
    "Kurumsal promosyon ürünleri: kalem, çanta, teknoloji, termos ve daha fazlası. Şirket logonuzla özelleştirilebilen yüzlerce ürün.",
  alternates: { canonical: "/" },
  openGraph: { ...openGraphBase, url: "/", title: "Promosyon Eticaret" },
};

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
