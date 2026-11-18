import { ThemeForm } from "@/components/admin/theme-form";
import { getAdminSiteId } from "@/lib/site-request";
import { getSiteIdentity } from "@/lib/site-settings";
import { readSiteTheme } from "@/lib/site-theme";

export const metadata = {
  title: "Tema",
};

export default async function AdminThemePage() {
  const siteId = await getAdminSiteId();
  const identity = getSiteIdentity(siteId);
  const theme = readSiteTheme(siteId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Tema ve Renkler</h2>
        <p className="text-sm text-zinc-500">
          Ana renkleri yönetin ve yalnızca {identity.siteName} sitesine
          uygulayın.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-bold text-zinc-900">
          Site Teması
        </h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Hazır bir tema seçebilir veya kendi ana ve vurgu renklerinizi
          tanımlayabilirsiniz. Seçim bu siteye özel saklanır; diğer sitelerin
          renklerini etkilemez.
        </p>
        <div className="mt-4">
          <ThemeForm theme={theme} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-bold text-zinc-900">
          Renkler nerede kullanılır?
        </h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Ana renk butonlar, bağlantılar, menü vurguları ve form odak
          halkalarında; vurgu rengi ise fiyatlar, etiketler ve küçük başlıklar
          gibi detaylarda kullanılır. Sayfa zemini ve metin renkleri tüm
          sitelerde ortak kalır.
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Değişiklikler kaydedildikten sonra sitenin tamamına ve bu siteye ait
          yönetim paneline uygulanır.
        </p>
      </section>
    </div>
  );
}
