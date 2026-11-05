import { HomeWidgetManager } from "@/components/admin/home-widget-manager";
import { fetchCollectionOptions, fetchHomeWidgets } from "@/lib/queries";

export const metadata = {
  title: "Anasayfa",
};

export default function AdminHomePage() {
  const widgets = fetchHomeWidgets();
  const collections = fetchCollectionOptions();
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

      <HomeWidgetManager collections={collections} widgets={widgets} />
    </div>
  );
}
