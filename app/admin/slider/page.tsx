import { SliderManager } from "@/components/admin/slider-manager";
import { db } from "@/lib/db";
import type { SliderItem } from "@/lib/types";

export const metadata = {
  title: "Slider",
};

export default async function AdminSliderPage() {
  const slides = db
    .prepare(
      "SELECT id, image_url, title, subtitle, link, sort_order, active FROM slider ORDER BY sort_order, id"
    )
    .all() as SliderItem[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Ana Sayfa Slider</h2>
        <p className="text-sm text-zinc-500">
          {slides.length} görsel • Görsel yoksa ana sayfada varsayılan kapak
          gösterilir
        </p>
      </div>

      <SliderManager slides={slides} />
    </div>
  );
}
