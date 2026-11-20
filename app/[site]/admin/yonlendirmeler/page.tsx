import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  RedirectDeleteForm,
  RedirectToggle,
} from "@/components/admin/redirect-actions";
import { parseSource } from "@/lib/redirect-pattern";
import { listRedirects } from "@/lib/redirects";
import { getAdminSiteId } from "@/lib/site-request";

export const instant = false;

export const metadata = { title: "Yönlendirmeler" };

const STATUS_MESSAGES: Record<string, string> = {
  eklendi: "Yönlendirme eklendi ve hemen geçerli oldu.",
  guncellendi: "Yönlendirme güncellendi.",
  silindi: "Yönlendirme silindi.",
};

export default async function AdminRedirectsPage(
  props: PageProps<"/[site]/admin/yonlendirmeler">
) {
  const query = await props.searchParams;
  const message =
    typeof query.durum === "string" ? STATUS_MESSAGES[query.durum] : undefined;

  const siteId = await getAdminSiteId();
  const rules = listRedirects(siteId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Yönlendirmeler</h2>
          <p className="text-sm text-zinc-500">
            {rules.length} kural • Eski adresleri yeni adreslere taşıyın
          </p>
        </div>
        <Link
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
          href="/admin/yonlendirmeler/yeni"
        >
          Yeni Yönlendirme
        </Link>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-1 text-sm leading-6 text-amber-900">
            <p className="font-bold">Dikkat: Buradaki kurallar canlı sitede anında geçerlidir.</p>
            <p>
              Emin olmadığınız bir kaydı eklemeyin, değiştirmeyin veya
              silmeyin. Sitede var olan bir sayfanın adresiyle çakışan kural o
              sayfayı erişilemez yapabilir. Silme işlemi geri alınamaz; emin
              değilseniz kuralı silmek yerine pasife alın. Toplu değişiklik
              öncesinde veritabanı yedeği almanız önerilir.
            </p>
            <p className="text-amber-800">
              301 kalıcı yönlendirmeler tarayıcılarda ve arama motorlarında
              önbelleğe alınır. Test ederken 302 kullanmak, kuralları
              denedikten sonra 301&apos;e geçmek daha güvenlidir.
            </p>
          </div>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      <details className="rounded-2xl border border-zinc-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Nasıl kullanılır? Tek URL ve desen (pattern) örnekleri
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
          <div>
            <p className="font-semibold text-zinc-800">Tek URL</p>
            <p className="font-mono text-xs text-zinc-700">
              /kategoriDetay/12/kalem
              <ArrowRight className="mx-1 inline h-3.5 w-3.5" />
              /kategori/kalem
            </p>
            <p>
              Tek bir eski adresi belirli bir yeni adrese yönlendirir.
            </p>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">Desen (pattern)</p>
            <p className="font-mono text-xs text-zinc-700">
              /kategoriDetay/:id/:slug
              <ArrowRight className="mx-1 inline h-3.5 w-3.5" />
              /kategori/:slug
            </p>
            <p>
              Kalıptaki her <code>:değişken</code> bir yol bölümüyle eşleşir ve
              hedefe aktarılır. <code>:ad*</code> joker&apos;i kalan tüm
              bölümleri yakalar ve yalnızca desenin sonunda kullanılabilir.
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Sorgu parametreleri (örn. <code>?sayfa=2</code>) hedefe otomatik
            eklenir. Kaynak adresler büyük/küçük harfe duyarlıdır; eski
            adresleri birebir yazın.
          </p>
        </div>
      </details>

      <div className="space-y-3">
        {rules.map((rule) => {
          const parsed = parseSource(rule.source).parsed;
          const isPattern = parsed?.kind === "pattern";
          const isActive = rule.active === 1;

          return (
            <div
              className={`rounded-2xl border bg-white p-4 ${
                isActive ? "border-zinc-200" : "border-zinc-200 bg-zinc-50/60"
              }`}
              key={rule.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPattern
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {isPattern ? "Desen" : "Tek URL"}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                      {rule.status_code === 302 ? "302 Geçici" : "301 Kalıcı"}
                    </span>
                    {!isActive ? (
                      <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                        Pasif
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="break-all font-mono text-sm font-semibold text-zinc-900">
                      {rule.source}
                    </p>
                    <p className="flex items-start gap-1.5 break-all font-mono text-sm text-zinc-500">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{rule.destination}</span>
                    </p>
                  </div>

                  {rule.note ? (
                    <p className="mt-2 text-xs text-zinc-500">{rule.note}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <RedirectToggle active={isActive} id={rule.id} />
                  {parsed?.kind === "exact" ? (
                    <a
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      href={rule.source}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Test Et
                    </a>
                  ) : null}
                  <Link
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    href={`/admin/yonlendirmeler/${rule.id}`}
                  >
                    Düzenle
                  </Link>
                  <RedirectDeleteForm id={rule.id} source={rule.source} />
                </div>
              </div>
            </div>
          );
        })}

        {rules.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
            Henüz yönlendirme kuralı yok. Eski PHP sitenizin Google&apos;da
            indexlenmiş adreslerini &quot;Yeni Yönlendirme&quot; ile yeni
            adreslere bağlayın.
          </p>
        ) : null}
      </div>
    </div>
  );
}
