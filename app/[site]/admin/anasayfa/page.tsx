import { HomeWidgetManager } from "@/components/admin/home-widget-manager";
import {
  fetchClientReferences,
  fetchCollectionOptions,
  fetchHomeWidgets,
} from "@/lib/queries";
import { getAdminSiteId } from "@/lib/site-request";

export const instant = false;

export const metadata = {
  title: "Anasayfa",
};

export default async function AdminHomePage() {
  const siteId = await getAdminSiteId();
  const widgets = fetchHomeWidgets(siteId);
  const collections = fetchCollectionOptions(siteId);
  const referenceCount = fetchClientReferences(siteId, {
    activeOnly: true,
  }).length;
  const active = widgets.filter((widget) => widget.active === 1).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">
          Ana Sayfa Widget Alanları
        </h2>
        <p className="text-sm text-zinc-500">
          {active} / {widgets.length} aktif • Sıralama ana sayfadaki görünüm
          sırasıdır
        </p>
      </div>

      <HomeWidgetManager
        collections={collections}
        referenceCount={referenceCount}
        widgets={widgets}
      />
    </div>
  );
}
