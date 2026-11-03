import { HomeWidgetSection } from "@/components/catalog/home-widget";
import { getHomeWidgets } from "@/lib/queries";

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
