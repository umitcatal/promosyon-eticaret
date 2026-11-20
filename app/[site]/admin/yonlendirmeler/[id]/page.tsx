import { notFound } from "next/navigation";
import { RedirectForm } from "@/components/admin/redirect-form";
import { getRedirect } from "@/lib/redirects";
import { getAdminSiteId } from "@/lib/site-request";

export const instant = false;

export const metadata = { title: "Yönlendirmeyi Düzenle" };

export default async function EditAdminRedirectPage(
  props: PageProps<"/[site]/admin/yonlendirmeler/[id]">
) {
  const { id } = await props.params;
  const redirectId = Number(id);
  if (!Number.isInteger(redirectId) || redirectId <= 0) notFound();

  const rule = getRedirect(await getAdminSiteId(), redirectId);
  if (!rule) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">
          Yönlendirmeyi Düzenle
        </h2>
        <p className="break-all font-mono text-sm text-zinc-500">
          {rule.source}
        </p>
      </div>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Bu kayıt canlı sitede kullanılıyor olabilir. Emin olmadığınız bir
        değişikliği kaydetmeyin; gerekirse kaydı silmek yerine pasife alın.
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <RedirectForm rule={rule} />
      </div>
    </div>
  );
}
